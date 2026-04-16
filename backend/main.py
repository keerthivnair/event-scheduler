from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timedelta, time
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Slot It API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# --- Schedules ---
@app.post("/schedules", response_model=schemas.Schedule)
def create_schedule(schedule: schemas.ScheduleCreate, db: Session = Depends(get_db)):
    db_schedule = models.Schedule(**schedule.model_dump())
    db.add(db_schedule)
    db.commit()
    db.refresh(db_schedule)
    return db_schedule

@app.get("/schedules", response_model=List[schemas.Schedule])
def get_schedules(db: Session = Depends(get_db)):
    schedules = db.query(models.Schedule).all()
    if not schedules:
        # Create a default schedule if none exists
        default = models.Schedule(name="Working Hours", is_default=True)
        db.add(default)
        db.commit()
        db.refresh(default)
        return [default]
    return schedules

@app.delete("/schedules/{id}")
def delete_schedule(id: int, db: Session = Depends(get_db)):
    sched = db.query(models.Schedule).filter(models.Schedule.id == id).first()
    if sched:
        db.delete(sched)
        db.commit()
    return {"message": "Deleted"}

# --- Date Overrides ---
@app.post("/date_overrides", response_model=schemas.DateOverride)
def create_date_override(override: schemas.DateOverrideCreate, db: Session = Depends(get_db)):
    db_override = models.DateOverride(**override.model_dump())
    db.add(db_override)
    db.commit()
    db.refresh(db_override)
    return db_override

@app.get("/date_overrides/{schedule_id}", response_model=List[schemas.DateOverride])
def get_date_overrides(schedule_id: int, db: Session = Depends(get_db)):
    return db.query(models.DateOverride).filter(models.DateOverride.schedule_id == schedule_id).all()

@app.delete("/date_overrides/{id}")
def delete_date_override(id: int, db: Session = Depends(get_db)):
    ov = db.query(models.DateOverride).filter(models.DateOverride.id == id).first()
    if ov:
        db.delete(ov)
        db.commit()
    return {"message": "Deleted"}

# --- Event Types ---
@app.post("/event_types", response_model=schemas.EventType)
def create_event_type(event_type: schemas.EventTypeCreate, db: Session = Depends(get_db)):
    db_event_type = models.EventType(**event_type.model_dump())
    db.add(db_event_type)
    db.commit()
    db.refresh(db_event_type)
    return db_event_type

@app.get("/event_types", response_model=List[schemas.EventType])
def get_event_types(db: Session = Depends(get_db)):
    return db.query(models.EventType).all()

@app.get("/event_types/{slug}", response_model=schemas.EventType)
def get_event_type_by_slug(slug: str, db: Session = Depends(get_db)):
    et = db.query(models.EventType).filter(models.EventType.slug == slug).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    return et

@app.put("/event_types/{id}", response_model=schemas.EventType)
def update_event_type(id: int, event_type: schemas.EventTypeCreate, db: Session = Depends(get_db)):
    et = db.query(models.EventType).filter(models.EventType.id == id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    
    for key, value in event_type.model_dump().items():
        setattr(et, key, value)
    db.commit()
    db.refresh(et)
    return et

@app.delete("/event_types/{id}")
def delete_event_type(id: int, db: Session = Depends(get_db)):
    et = db.query(models.EventType).filter(models.EventType.id == id).first()
    if et:
        now = datetime.now()
        upcoming_meetings = db.query(models.Meeting).filter(
            models.Meeting.event_type_id == id,
            models.Meeting.status != "canceled",
            models.Meeting.date >= now.date()
        ).all()
        for m in upcoming_meetings:
            dt_start = datetime.combine(m.date, m.start_time)
            if dt_start > now:
                m.status = "canceled"
                # Mock email
                print(f"EMAIL SENT TO: {m.invitee_email} | SUBJECT: Meeting Cancelled | MESSAGE: The admin has cancelled the event type '{et.name}'. Your meeting on {m.date} at {m.start_time} is cancelled.")
        
        db.delete(et)
        db.commit()
    return {"message": "Deleted"}

# --- Availability ---
@app.post("/availability", response_model=schemas.Availability)
def create_availability(availability: schemas.AvailabilityCreate, db: Session = Depends(get_db)):
    # Check for exact duplicate availability
    existing = db.query(models.Availability).filter(
        models.Availability.day_of_week == availability.day_of_week,
        models.Availability.start_time == availability.start_time,
        models.Availability.end_time == availability.end_time,
        models.Availability.timezone == availability.timezone
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="This exact availability schedule already exists.")
        
    db_availability = models.Availability(**availability.model_dump())
    db.add(db_availability)
    db.commit()
    db.refresh(db_availability)
    return db_availability

@app.get("/availability", response_model=List[schemas.Availability])
def get_availability(db: Session = Depends(get_db)):
    return db.query(models.Availability).all()

@app.delete("/availability/{id}")
def delete_availability(id: int, db: Session = Depends(get_db)):
    av = db.query(models.Availability).filter(models.Availability.id == id).first()
    if av:
        db.delete(av)
        db.commit()
    return {"message": "Deleted"}

# --- Slots Logic ---
@app.get("/slots")
def get_available_slots(target_date: date, event_type_id: int, db: Session = Depends(get_db)):
    # 1. Get Event Type
    et = db.query(models.EventType).filter(models.EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    
    duration = et.duration
    buffer_before = et.buffer_before
    buffer_after = et.buffer_after
    schedule_id = et.schedule_id

    # If event type has no schedule, use the default one
    if not schedule_id:
        default_sched = db.query(models.Schedule).filter(models.Schedule.is_default == True).first()
        if not default_sched:
            # Fallback if somehow no default schedule exists
            default_sched = models.Schedule(name="Working Hours", is_default=True)
            db.add(default_sched)
            db.commit()
            db.refresh(default_sched)
        schedule_id = default_sched.id

    day_of_week = target_date.weekday()

    # 2. Check for Date Overrides (Query both as object and string for SQLite robustness)
    override = db.query(models.DateOverride).filter(
        models.DateOverride.schedule_id == schedule_id
    ).filter(
        (models.DateOverride.date == target_date) | 
        (models.DateOverride.date == target_date.isoformat())
    ).first()

    working_sessions = []
    if override:
        if override.is_unavailable:
            return []
        if override.start_time and override.end_time:
            working_sessions.append((override.start_time, override.end_time, "Asia/Kolkata")) # Using IST as requested
    else:
        # Filter by schedule_id
        availabilities = db.query(models.Availability).filter(
            models.Availability.schedule_id == schedule_id,
            models.Availability.day_of_week == day_of_week
        ).all()
        
        # User asked for IST as default
        user_tz_str = "Asia/Kolkata" 
        
        for av in availabilities:
            working_sessions.append((av.start_time, av.end_time, av.timezone or user_tz_str))

    print(f"--- Slot Generation Diagnostic ---")
    print(f"Date: {target_date}, Day: {day_of_week}, Schedule ID: {schedule_id}")
    print(f"Sessions: {working_sessions}")

    if not working_sessions:
        return []

    meetings = db.query(models.Meeting).filter(
        models.Meeting.date == target_date,
        models.Meeting.status != "canceled"
    ).all()

    booked_intervals = []
    for m in meetings:
        m_et = m.event_type
        m_buffer = m_et.buffer_before if m_et else 0
        dt_start = datetime.combine(target_date, m.start_time) - timedelta(minutes=m_buffer)
        dt_end = datetime.combine(target_date, m.end_time)
        booked_intervals.append((dt_start, dt_end))
    
    available_slots = []
    now = datetime.now()
    
    # 1. Calculate the current time in IST to compare Today's slots
    try:
        from zoneinfo import ZoneInfo
        ist_tz = ZoneInfo("Asia/Kolkata")
        now_ist = datetime.now(ist_tz).replace(tzinfo=None)
    except Exception:
        now_ist = now

    for start_t, end_t, tzone in working_sessions:
        # Convert start_t/end_t (could be string or time object) to time
        if isinstance(start_t, str):
            st = datetime.strptime(start_t.split('.')[0], "%H:%M:%S").time()
        else: st = start_t
        
        if isinstance(end_t, str):
            en = datetime.strptime(end_t.split('.')[0], "%H:%M:%S").time()
        else: en = end_t
            
        current_dt = datetime.combine(target_date, st)
        end_dt = datetime.combine(target_date, en)

        while current_dt + timedelta(minutes=duration) <= end_dt:
            slot_start_check = current_dt - timedelta(minutes=buffer_before)
            slot_end_check = current_dt + timedelta(minutes=duration)
            
            overlap = False
            for b_start, b_end in booked_intervals:
                if (slot_start_check < b_end) and (slot_end_check > b_start):
                    overlap = True
                    break
            
            # Slot is valid if it doesn't overlap and is in the future
            if not overlap and current_dt > now_ist:
                available_slots.append(current_dt.strftime("%H:%M:%S"))
                
            current_dt += timedelta(minutes=15) 

    print(f"Final Count: {len(available_slots)}")
    return available_slots

# --- Meetings ---
@app.post("/meetings", response_model=schemas.Meeting)
def create_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    if meeting.rescheduled_from_id:
        old_meeting = db.query(models.Meeting).filter(models.Meeting.id == meeting.rescheduled_from_id).first()
        if old_meeting:
            old_meeting.status = "canceled"
            print(f"EMAIL TO: {old_meeting.invitee_email} | Subject: Rescheduled | Your meeting is moved to {meeting.date} at {meeting.start_time}")

    # Double-booking check with buffer
    existing_meetings = db.query(models.Meeting).filter(
        models.Meeting.date == meeting.date,
        models.Meeting.status != "canceled"
    ).all()

    for m in existing_meetings:
        m_et = m.event_type
        m_buffer = m_et.buffer_before if m_et else 0
        b_start = datetime.combine(m.date, m.start_time) - timedelta(minutes=m_buffer)
        b_end = datetime.combine(m.date, m.end_time)
        
        dt_req_start = datetime.combine(meeting.date, meeting.start_time)
        dt_req_end = datetime.combine(meeting.date, meeting.end_time)

        if (dt_req_start < b_end) and (dt_req_end > b_start):
             raise HTTPException(status_code=400, detail="Conflict: This slot is unavailable due to an existing booking or its buffer.")

    db_meeting = models.Meeting(**meeting.model_dump())
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    et = db.query(models.EventType).filter(models.EventType.id == meeting.event_type_id).first()
    et_name = et.name if et else "Meeting"
    print(f"EMAIL TO: {db_meeting.invitee_email} | Subject: Confirmed | Your meeting '{et_name}' on {db_meeting.date} is confirmed.")
    
    return db_meeting

@app.get("/meetings/{id}", response_model=schemas.Meeting)
def get_meeting(id: int, db: Session = Depends(get_db)):
    m = db.query(models.Meeting).filter(models.Meeting.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return m

@app.get("/meetings", response_model=List[schemas.Meeting])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).order_by(models.Meeting.date.desc(), models.Meeting.start_time.desc()).all()

@app.post("/meetings/{id}/cancel")
def cancel_meeting(id: int, db: Session = Depends(get_db)):
    m = db.query(models.Meeting).filter(models.Meeting.id == id).first()
    if m:
        m.status = "canceled"
        db.commit()
        print(f"EMAIL TO: {m.invitee_email} | Subject: Cancelled | Your meeting was cancelled.")
    return {"message": "Canceled"}

@app.patch("/meetings/{id}/notes")
def update_meeting_notes(id: int, note_data: dict, db: Session = Depends(get_db)):
    m = db.query(models.Meeting).filter(models.Meeting.id == id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Meeting not found")
    m.admin_notes = note_data.get("notes")
    db.commit()
    print(f"EMAIL TO: {m.invitee_email} | Subject: Follow-up | Admin Note: {m.admin_notes}")
    return {"message": "Notes updated"}
