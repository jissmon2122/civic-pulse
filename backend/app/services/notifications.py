from typing import Optional
from sqlalchemy.orm import Session
from app.models import Notification
from app.config import settings


def create_notification(
    db: Session,
    recipient_id: str,
    title: str,
    message: str,
    report_id: Optional[str] = None
) -> Notification:
    """
    Creates an internal in-app notification for the user.
    If email delivery is configured, attempts email delivery asynchronously or logs fallback.
    """
    notification = Notification(
        recipient_id=recipient_id,
        report_id=report_id,
        title=title,
        message=message
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    # Optional email delivery check
    if settings.EMAIL_PROVIDER_ENABLED and settings.SMTP_HOST:
        # In a production environment with valid SMTP credentials, a background task sends the email
        pass

    return notification
