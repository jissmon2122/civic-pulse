import json
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models import AuditLog


def log_audit_event(
    db: Session,
    action: str,
    entity_type: str,
    entity_id: Optional[str] = None,
    actor_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Safely records an audit log entry stripped of sensitive attributes."""
    safe_meta = {}
    if metadata:
        # Sanitize metadata to guarantee no passwords, tokens, or hashes are stored
        sensitive_keys = {"password", "token", "secret", "password_hash", "access_token"}
        for k, v in metadata.items():
            if k.lower() not in sensitive_keys:
                safe_meta[k] = str(v)

    audit_entry = AuditLog(
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id else None,
        metadata_json=json.dumps(safe_meta) if safe_meta else None
    )
    db.add(audit_entry)
    db.commit()
    return audit_entry
