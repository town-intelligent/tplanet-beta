"""Authentication signin/signup operations."""
import logging

import pytz
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import make_password
from django.contrib.auth.models import User
from django.utils import timezone

from accounts.jwt_tools import generate as generate_jwt
from accounts.models import AccountProfile

logger = logging.getLogger('tplanet')


def get_tenant_db():
    """Get the database for the current tenant."""
    try:
        from django_multi_tenant.middleware.tenant_context import get_current_tenant
        tenant = get_current_tenant()
        if tenant and tenant.database:
            return tenant.database
    except ImportError:
        pass
    return "default"


def signup(request):
    """Register a new user."""
    if User.objects.filter(username=request["username"]).exists():
        return False, "User already exist"
    if User.objects.filter(email=request["email"]).exists():
        return False, "User already exist"

    user = User.objects.create(
        username=request["username"],
        password=make_password(request["password"]),
        email=request["email"]
    )
    user.save()
    AccountProfile.objects.create(obj_user=user)
    return True, generate_jwt(user)


def signin(req):
    """Sign in a user."""
    try:
        email = (req.get("email") or "").strip()
        password = req.get("password") or ""

        if not email or not password:
            logger.warning("[signin] missing email/password")
            return False, "", 403

        db = get_tenant_db()
        try:
            user = User.objects.using(db).get(email=email)
        except User.DoesNotExist:
            logger.warning(f"[signin] user not found: {email} (db={db})")
            return False, "", 403

        authed = authenticate(username=user.username, password=password)
        if authed is None:
            logger.warning(f"[signin] authenticate failed, username={user.username}")
            return False, "", 403

        _update_login_record(user)
        return True, authed.username, generate_jwt(authed)

    except Exception as e:
        logger.error(f"[signin] ERROR: {e}")
        return False, "", 500


def _update_login_record(user):
    """Update user login record in AccountProfile."""
    tz = pytz.timezone("Asia/Taipei")
    now = timezone.now()
    taipei_time = now.astimezone(tz)

    profile, _ = AccountProfile.objects.get_or_create(obj_user=user)

    login_record = {"login_time": taipei_time.strftime("%Y-%m-%d %H:%M:%S")}
    if not isinstance(profile.login_records, list):
        profile.login_records = []
    profile.login_records.insert(0, login_record)
    profile.login_records = profile.login_records[:100]

    profile.last_login_at = now
    profile.login_count += 1
    profile.save()


def impersonate(req, current_user):
    """
    Allow superuser to impersonate another user without password.
    Returns a JWT token for the target user.
    """
    try:
        target_email = (req.get("target_email") or "").strip()

        if not target_email:
            return False, "Missing target_email", 400

        # Check if current user is superuser (from tenant config)
        db = get_tenant_db()
        try:
            from django_multi_tenant.middleware.tenant_context import get_current_tenant
            tenant = get_current_tenant()
            superusers = tenant.config.get("superusers", []) if tenant else []
            if current_user.email not in superusers:
                logger.warning(f"[impersonate] non-superuser tried to impersonate: {current_user.email}")
                return False, "Only superusers can impersonate", 403
        except Exception as e:
            logger.error(f"[impersonate] Error checking superuser: {e}")
            return False, "Permission check failed", 403

        # Get target user
        try:
            target_user = User.objects.using(db).get(email=target_email)
        except User.DoesNotExist:
            logger.warning(f"[impersonate] target user not found: {target_email}")
            return False, "Target user not found", 404

        # Generate token for target user
        token = generate_jwt(target_user)
        logger.info(f"[impersonate] {current_user.email} -> {target_email}")
        return True, token, 200

    except Exception as e:
        logger.error(f"[impersonate] ERROR: {e}")
        return False, str(e), 500
