"""Profile information operations."""
import logging

from django.contrib.auth.models import User

from accounts.models import AccountProfile

logger = logging.getLogger('tplanet')


def get_user_info(request):
    """Get user information by email."""
    email = request.get("email")
    if not email:
        return False, "Email is required"

    if not User.objects.filter(email=email).exists():
        return False, "User does not exist"

    user = User.objects.get(email=email)
    return True, {
        "username": user.username,
        "email": user.email,
        "groups": [g.name for g in user.groups.all()],
        "active": user.is_active
    }


def get_user_list():
    """List all users (with or without AccountProfile)."""
    users = User.objects.all().order_by('-date_joined')
    result = []
    for user in users:
        profile = AccountProfile.objects.filter(obj_user=user).first()
        result.append({
            "id": user.id,
            "email": user.email,
            "undertake": profile.undertake if profile else "",
            "hoster": profile.hoster if profile else "",
            "role": profile.role if profile else "一般使用者",
            "phone_number": profile.phone_number if profile else "",
            "last_login_at": profile.last_login_at.strftime("%Y-%m-%d %H:%M:%S") if profile and profile.last_login_at else "-",
            "login_count": profile.login_count if profile else 0,
        })
    return True, result


def get_user_login_records(req):
    """Get login records for a user."""
    try:
        email = req.GET.get("email")
        if not email:
            return {"result": False, "error": "Missing email parameter"}

        try:
            user = User.objects.get(email=email)
            profile = AccountProfile.objects.get(obj_user=user)
            records = profile.login_records or []
            return {"result": True, "login_records": records, "total_count": len(records)}
        except User.DoesNotExist:
            return {"result": False, "error": "User not found"}
        except AccountProfile.DoesNotExist:
            return {"result": True, "login_records": [], "total_count": 0}

    except Exception as e:
        logger.error(f"[get_user_login_records] ERROR: {e}")
        return {"result": False, "error": "Internal error"}
