from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time

class ScheduleBase(BaseModel):
    name: str
    is_default: bool = False

class ScheduleCreate(ScheduleBase):
    pass

class Schedule(ScheduleBase):
    id: int
    class Config:
        from_attributes = True

class DateOverrideBase(BaseModel):
    date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_unavailable: bool = False
    schedule_id: int

class DateOverrideCreate(DateOverrideBase):
    pass

class DateOverride(DateOverrideBase):
    id: int
    class Config:
        from_attributes = True

class EventTypeBase(BaseModel):
    name: str
    duration: int
    slug: str
    description: Optional[str] = None
    buffer_before: int = 0
    buffer_after: int = 0
    custom_questions: Optional[str] = None
    schedule_id: Optional[int] = None

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
    schedule_id: int

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
    custom_responses: Optional[str] = None
    admin_notes: Optional[str] = None
    rescheduled_from_id: Optional[int] = None

class MeetingCreate(MeetingBase):
    pass

class Meeting(MeetingBase):
    id: int
    status: str
    event_type: Optional[EventType] = None
    class Config:
        from_attributes = True
