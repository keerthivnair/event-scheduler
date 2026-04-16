from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Date, Time, Text
from sqlalchemy.orm import relationship
from database import Base

class EventType(Base):
    __tablename__ = "event_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    duration = Column(Integer) # in minutes
    slug = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)

    meetings = relationship("Meeting", back_populates="event_type")

class Availability(Base):
    __tablename__ = "availabilities"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(Integer) # 0 = Monday, 6 = Sunday
    start_time = Column(Time)
    end_time = Column(Time)
    timezone = Column(String, default="UTC")

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

    event_type = relationship("EventType", back_populates="meetings")
