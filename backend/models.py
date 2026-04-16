from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, Text
from sqlalchemy.orm import relationship
from database import Base

class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    is_default = Column(Boolean, default=False)

    availabilities = relationship("Availability", back_populates="schedule", cascade="all, delete-orphan")
    overrides = relationship("DateOverride", back_populates="schedule", cascade="all, delete-orphan")
    event_types = relationship("EventType", back_populates="schedule")

class EventType(Base):
    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    duration = Column(Integer) # in minutes
    slug = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    buffer_before = Column(Integer, default=0)
    buffer_after = Column(Integer, default=0)
    custom_questions = Column(Text, nullable=True) # JSON string
    schedule_id = Column(Integer, ForeignKey("schedules.id"), nullable=True)

    meetings = relationship("Meeting", back_populates="event_type")
    schedule = relationship("Schedule", back_populates="event_types")

class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    day_of_week = Column(Integer) # 0 = Monday, 6 = Sunday
    start_time = Column(Time)
    end_time = Column(Time)
    timezone = Column(String, default="UTC")

    schedule = relationship("Schedule", back_populates="availabilities")

class DateOverride(Base):
    __tablename__ = "date_overrides"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("schedules.id"))
    date = Column(Date)
    start_time = Column(Time, nullable=True) # If null and not unavailable, use default? No, overrides define the whole day.
    end_time = Column(Time, nullable=True)
    is_unavailable = Column(Boolean, default=False)

    schedule = relationship("Schedule", back_populates="overrides")

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    event_type_id = Column(Integer, ForeignKey("event_types.id"))
    invitee_name = Column(String)
    invitee_email = Column(String)
    date = Column(Date)
    start_time = Column(Time)
    end_time = Column(Time)
    status = Column(String, default="scheduled") # scheduled, canceled
    custom_responses = Column(String, nullable=True) # JSON string of answers
    admin_notes = Column(String, nullable=True) # Admin can write notes/replies here
    rescheduled_from_id = Column(Integer, ForeignKey("meetings.id"), nullable=True)

    event_type = relationship("EventType", back_populates="meetings")
