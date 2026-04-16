from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from datetime import date, time, timedelta

models.Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(models.EventType).first():
        print("Database already seeded.")
        return

    # 1. Event Types
    event1 = models.EventType(name="15 Minute Meeting", duration=15, slug="15min", description="Quick catch up")
    event2 = models.EventType(name="30 Minute Meeting", duration=30, slug="30min", description="Standard meeting")
    event3 = models.EventType(name="60 Minute Interview", duration=60, slug="60min", description="Interview slot")
    
    db.add_all([event1, event2, event3])
    db.commit()

    # 2. Availability (Mon-Fri 9AM-5PM)
    for day in range(5): # 0 to 4 (Monday to Friday)
        av = models.Availability(
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(17, 0),
            timezone="UTC"
        )
        db.add(av)
    
    db.commit()

    # 3. Dummy Meetings
    today = date.today()
    tomorrow = today + timedelta(days=1)
    
    m1 = models.Meeting(
        event_type_id=event2.id,
        invitee_name="John Doe",
        invitee_email="john@example.com",
        date=tomorrow,
        start_time=time(10, 0),
        end_time=time(10, 30),
        status="scheduled"
    )
    
    m2 = models.Meeting(
        event_type_id=event3.id,
        invitee_name="Jane Smith",
        invitee_email="jane@example.com",
        date=today,
        start_time=time(14, 0),
        end_time=time(15, 0),
        status="scheduled"
    )

    db.add_all([m1, m2])
    db.commit()

    print("Database seeded successfully.")

if __name__ == "__main__":
    seed()
