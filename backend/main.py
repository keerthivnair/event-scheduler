from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime, timedelta, time
import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Calendly Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    # 1. Get Event Type Duration
    et = db.query(models.EventType).filter(models.EventType.id == event_type_id).first()
    if not et:
        raise HTTPException(status_code=404, detail="Event type not found")
    duration = et.duration

    # 2. Get Availability for the given day of the week
    day_of_week = target_date.weekday() # 0 = Monday, 6 = Sunday
    availabilities = db.query(models.Availability).filter(models.Availability.day_of_week == day_of_week).all()
    
    if not availabilities:
        return []

    # 3. Get existing meetings for this date to prevent double booking
    meetings = db.query(models.Meeting).filter(
        models.Meeting.date == target_date,
        models.Meeting.status != "canceled"
    ).all()

    booked_intervals = []
    for m in meetings:
        dt_start = datetime.combine(target_date, m.start_time)
        dt_end = datetime.combine(target_date, m.end_time)
        booked_intervals.append((dt_start, dt_end))

    available_slots = []
    now = datetime.now()
    
    if target_date < now.date():
        return []

    for av in availabilities:
        current_dt = datetime.combine(target_date, av.start_time)
        end_dt = datetime.combine(target_date, av.end_time)

        # Handle exact local time based on the timezone selected!
        try:
            from zoneinfo import ZoneInfo
            tz = ZoneInfo(av.timezone)
            now_tz = datetime.now(tz).replace(tzinfo=None)
        except Exception:
            now_tz = now

        while current_dt + timedelta(minutes=duration) <= end_dt:
            slot_end_dt = current_dt + timedelta(minutes=duration)
            
            # check overlap
            overlap = False
            for b_start, b_end in booked_intervals:
                if (current_dt < b_end) and (slot_end_dt > b_start):
                    overlap = True
                    break
            
            if not overlap and slot_end_dt > now_tz:
                available_slots.append(current_dt.strftime("%H:%M:%S"))
                
            current_dt += timedelta(minutes=30) # Interval between options, let's make it 30 mins

    return available_slots

# --- Meetings ---
@app.post("/meetings", response_model=schemas.Meeting)
def create_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    # Verify no double booking
    dt_req_start = datetime.combine(meeting.date, meeting.start_time)
    dt_req_end = datetime.combine(meeting.date, meeting.end_time)

    existing_meetings = db.query(models.Meeting).filter(
        models.Meeting.date == meeting.date,
        models.Meeting.status != "canceled"
    ).all()

    for m in existing_meetings:
        b_start = datetime.combine(m.date, m.start_time)
        b_end = datetime.combine(m.date, m.end_time)
        if (dt_req_start < b_end) and (dt_req_end > b_start):
            raise HTTPException(status_code=400, detail="Time slot already booked")

    et = db.query(models.EventType).filter(models.EventType.id == meeting.event_type_id).first()
    et_name = et.name if et else "Meeting"

    db_meeting = models.Meeting(**meeting.model_dump())
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    print(f"EMAIL SENT TO: {db_meeting.invitee_email} | SUBJECT: Booking Confirmation | MESSAGE: Your meeting '{et_name}' on {db_meeting.date} at {db_meeting.start_time} is confirmed.")
    
    return db_meeting

@app.get("/meetings", response_model=List[schemas.Meeting])
def get_meetings(db: Session = Depends(get_db)):
    return db.query(models.Meeting).order_by(models.Meeting.date.desc(), models.Meeting.start_time.desc()).all()

@app.post("/meetings/{id}/cancel")
def cancel_meeting(id: int, db: Session = Depends(get_db)):
    m = db.query(models.Meeting).filter(models.Meeting.id == id).first()
    if m:
        m.status = "canceled"
        db.commit()
        print(f"EMAIL SENT TO: {m.invitee_email} | SUBJECT: Meeting Cancelled | MESSAGE: Your meeting on {m.date} at {m.start_time} has been cancelled.")
    return {"message": "Canceled"}
