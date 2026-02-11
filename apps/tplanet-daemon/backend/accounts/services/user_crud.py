"""User CRUD operations."""
import logging
import random
import string

from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import Group, User
from django.db import transaction

from accounts.models import AccountProfile
from portal.gmail import send_gmail

logger = logging.getLogger('tplanet')


def _get_tenant_config():
    """Get the TenantConfig for the current tenant."""
    try:
        from django_multi_tenant.middleware.tenant_context import get_current_tenant
        from django_multi_tenant.models import TenantConfig
        tenant = get_current_tenant()
        if tenant:
            return TenantConfig.objects.filter(tenant_id=tenant.tenant_id).first()
    except Exception as e:
        logger.error(f"[_get_tenant_config] {e}")
    return None


def _add_to_hosters(email):
    """Add email to tenant config hosters list."""
    config = _get_tenant_config()
    if not config:
        return
    hosters = config.hosters or []
    if email not in hosters:
        hosters.append(email)
        config.hosters = hosters
        config.save(update_fields=["hosters", "updated_at"])
        logger.info(f"[hosters] added {email}")


def _remove_from_hosters(email):
    """Remove email from tenant config hosters list (never remove index 0)."""
    config = _get_tenant_config()
    if not config:
        return
    hosters = config.hosters or []
    if email in hosters and hosters.index(email) != 0:
        hosters.remove(email)
        config.hosters = hosters
        config.save(update_fields=["hosters", "updated_at"])
        logger.info(f"[hosters] removed {email}")


def add_user(request):
    """Create a new user with AccountProfile."""
    try:
        fields = {k: (request.get(k) or "").strip() for k in ["email", "undertake", "hoster", "role"]}
        missing = [k for k, v in fields.items() if not v]
        if missing:
            return False, f"Missing required fields: {', '.join(missing)}"
        if User.objects.filter(email=fields["email"]).exists():
            return False, "User already exist"

        password = ''.join(random.sample(string.ascii_letters + string.digits, 8))
        with transaction.atomic():
            user = User.objects.create(username=fields["email"], password=make_password(password),
                                        email=fields["email"], is_active=request.get("enabled", True))
            AccountProfile.objects.create(obj_user=user, undertake=fields["undertake"],
                                            hoster=fields["hoster"], role=fields["role"],
                                            phone_number=request.get("phone_number"))
            _assign_group(user, fields["role"])

        _add_to_hosters(fields["email"])
        send_gmail("[小鎮智能] 您的密碼已經設置完成", fields["email"],
                   f"您好！這是您的新密碼，請儘速登入更改密碼： {password}")
        return True, user
    except Exception as e:
        return False, f"Internal error: {e}"


def _assign_group(user, role):
    """Assign group based on role."""
    try:
        Group.objects.get(name="201" if role == "admin" else "300").user_set.add(user)
    except Group.DoesNotExist:
        logger.error(f"Group does not exist for role: {role}")


def remove_member(request):
    """Remove a member from hosters (keep user account)."""
    email = (request.get("email") or "").strip()
    if not email:
        return False, "Email is required"
    _remove_from_hosters(email)
    return True, "OK"


def delete(request):
    """Delete a user and remove from hosters."""
    email = request["email"]
    if not User.objects.filter(email=email).exists():
        return False, "User does not exist"
    _remove_from_hosters(email)
    User.objects.get(email=email).delete()
    return True, "OK"


def modify_user(request):
    """Modify user profile information."""
    email = request.get('email')
    if not email:
        return False, "Email is required"
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return False, f"Cannot find user with email: {email}"

    with transaction.atomic():
        profile, created = AccountProfile.objects.get_or_create(
            obj_user=user, defaults={k: request.get(k, '') for k in ['undertake', 'hoster', 'role', 'phone_number']})
        if not created:
            for field in ['undertake', 'hoster', 'role', 'phone_number']:
                if field in request:
                    setattr(profile, field, request[field])
            profile.save()
    return True, "Modification successful"


def activate_user(request):
    """Activate or deactivate a user account."""
    email = request.get('email')
    if not email:
        return False, "Email is required"
    user = User.objects.filter(email=email).first()
    if not user:
        return False, f"Cannot find user with email: {email}"
    user.is_active = request.get('is_active', True)
    user.save()
    return True, "User activation status updated successfully"
