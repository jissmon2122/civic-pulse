from typing import Dict, Set, Tuple
from app.models import ReportStatus, UserRole


# Permitted state transitions in the CIVIC PULSE resolution pipeline
ALLOWED_TRANSITIONS: Dict[ReportStatus, Set[ReportStatus]] = {
    ReportStatus.SUBMITTED: {
        ReportStatus.UNDER_REVIEW,
        ReportStatus.REJECTED,
        ReportStatus.ASSIGNED
    },
    ReportStatus.UNDER_REVIEW: {
        ReportStatus.ASSIGNED,
        ReportStatus.NEEDS_INFORMATION,
        ReportStatus.REJECTED,
        ReportStatus.IN_PROGRESS
    },
    ReportStatus.NEEDS_INFORMATION: {
        ReportStatus.UNDER_REVIEW,
        ReportStatus.IN_PROGRESS,
        ReportStatus.REJECTED
    },
    ReportStatus.ASSIGNED: {
        ReportStatus.IN_PROGRESS,
        ReportStatus.UNDER_REVIEW,
        ReportStatus.NEEDS_INFORMATION,
        ReportStatus.REJECTED
    },
    ReportStatus.IN_PROGRESS: {
        ReportStatus.RESOLVED,
        ReportStatus.NEEDS_INFORMATION,
        ReportStatus.UNDER_REVIEW
    },
    ReportStatus.RESOLVED: {
        ReportStatus.CLOSED,
        ReportStatus.REOPENED
    },
    ReportStatus.CLOSED: {
        ReportStatus.REOPENED
    },
    ReportStatus.REOPENED: {
        ReportStatus.UNDER_REVIEW,
        ReportStatus.ASSIGNED,
        ReportStatus.IN_PROGRESS
    },
    ReportStatus.REJECTED: {
        ReportStatus.UNDER_REVIEW
    }
}


def can_transition_status(
    current_status: ReportStatus,
    target_status: ReportStatus,
    role: UserRole,
    is_reporter: bool = False
) -> Tuple[bool, str]:
    """
    Validates whether the requested state transition is allowed based on:
    1. The state transition graph.
    2. The caller's role (CITIZEN, STAFF, ADMIN).
    3. Whether the caller is the original reporter.
    """
    if current_status == target_status:
        return False, f"Report is already in {current_status.value} status."

    # Verify if valid in transition table
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if target_status not in allowed:
        return False, f"Invalid transition from {current_status.value} to {target_status.value}."

    # Role-based constraints
    if role == UserRole.CITIZEN:
        # Citizens can only:
        # 1. Provide clarification (NEEDS_INFORMATION -> UNDER_REVIEW) on their own report.
        # 2. Flag as unresolved (RESOLVED or CLOSED -> REOPENED) on their own report.
        if not is_reporter:
            return False, "Citizens cannot modify reports submitted by other users."

        if current_status == ReportStatus.NEEDS_INFORMATION and target_status == ReportStatus.UNDER_REVIEW:
            return True, "Permitted"

        if current_status in {ReportStatus.RESOLVED, ReportStatus.CLOSED} and target_status == ReportStatus.REOPENED:
            return True, "Permitted"

        return False, f"Citizens do not have permission to change status to {target_status.value}."

    elif role == UserRole.STAFF:
        # Staff can manage all review, assignment, in-progress, resolution, and information requests.
        # However, permanently closing or rejecting may require specific staff action.
        return True, "Permitted"

    elif role == UserRole.ADMIN:
        # Admin can execute any valid transition in the state machine.
        return True, "Permitted"

    return False, "Unauthorized role."
