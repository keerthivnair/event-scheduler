from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time

class EventTypeBase(BaseModel):
    name: str
    duration: int
    slug: str
    description: Optional[str] = None

class EventTypeCreate(EventTypeBase):
    pass

class EventType(EventTypeBase):
    id: int
    class Config:
        from_attributes = True

class AvailabilityBase(BaseModel):
    day_of_week: int
    start_time: time
    end_time: time
    timezone: str = "UTC"

class AvailabilityCreate(AvailabilityBase):
    pass

class Availability(AvailabilityBase):
    id: int
    class Config:
        from_attributes = True

class MeetingBase(BaseModel):
    event_type_id: Optional[int] = None
    invitee_name: str
    invitee_email: str
    date: date
    start_time: time
    end_time: time

class MeetingCreate(MeetingBase):
    pass

class Meeting(MeetingBase):
    id: int
    status: str
    event_type: Optional[EventType] = None
    class Config:
        from_attributes = True
