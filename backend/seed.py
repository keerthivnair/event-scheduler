from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models
from datetime import date, time, timedelta

def seed():
    # 0. Create tables if they don't exist
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(models.Schedule).first():
        print("Database already seeded.")
        return

    # 1. Create Default Schedule
    default_sched = models.Schedule(name="Working Hours", is_default=True)
    db.add(default_sched)
    db.commit()
    db.refresh(default_sched)

    # 2. Event Types
    event1 = models.EventType(
        name="15 Minute Meeting", 
        duration=15, 
        slug="15min", 
        description="Quick catch up", 
        schedule_id=default_sched.id,
        buffer_before=5,
        buffer_after=5
    )
    event2 = models.EventType(
        name="30 Minute Meeting", 
        duration=30, 
        slug="30min", 
        description="Standard meeting", 
        schedule_id=default_sched.id,
        custom_questions="What would you like to discuss?\nAny specific project mentioned?"
    )
    
    db.add_all([event1, event2])
    db.commit()

    # 3. Availability (Mon-Fri 9AM-5PM)
    for day in range(5): 
        av = models.Availability(
            schedule_id=default_sched.id,
            day_of_week=day,
            start_time=time(9, 0),
            end_time=time(17, 0),
            timezone="Asia/Kolkata"
        )
        db.add(av)
    
    db.commit()

    print("Database seeded successfully with Schedules and enhanced features.")

if __name__ == "__main__":
    seed()
