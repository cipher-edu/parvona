from rest_framework.exceptions import ValidationError, PermissionDenied

# Ruxsat etilgan o'tishlar xaritasi
TRANSITIONS: dict[str, list[str]] = {
    'pending':   ['confirmed', 'cancelled'],
    'confirmed': ['active',    'cancelled'],
    'active':    ['completed', 'disputed'],
    'completed': [],
    'cancelled': [],
    'disputed':  ['resolved'],
    'resolved':  [],
}

# Kim qaysi o'tishni amalga oshira oladi
# 'parent' | 'nanny' | 'admin' | 'any'
ACTOR_RULES: dict[str, list[str]] = {
    'confirmed': ['nanny'],
    'active':    ['nanny'],
    'cancelled': ['parent', 'nanny', 'admin'],
    'completed': ['nanny'],
    'disputed':  ['parent', 'nanny'],
    'resolved':  ['admin'],
}


def validate_transition(current_status: str, new_status: str) -> None:
    allowed = TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise ValidationError(
            f"'{current_status}' → '{new_status}' o'tish mumkin emas. "
            f"Ruxsat etilganlar: {allowed or 'yo\'q'}"
        )


def validate_actor(new_status: str, actor_role: str, actor_id, booking) -> None:
    allowed_roles = ACTOR_RULES.get(new_status, [])
    if not allowed_roles:
        return

    is_parent = str(booking.parent_id) == str(actor_id)
    is_nanny  = str(booking.nanny_id)  == str(actor_id)

    obj_match  = (
        ('parent' in allowed_roles and is_parent) or
        ('nanny'  in allowed_roles and is_nanny)  or
        ('admin'  in allowed_roles and actor_role == 'admin')
    )

    if not obj_match:
        raise PermissionDenied(
            f"'{new_status}' holatiga o'tkazish uchun huquqingiz yo'q."
        )
