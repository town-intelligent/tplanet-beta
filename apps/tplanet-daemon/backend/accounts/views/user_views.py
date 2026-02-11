"""User management views."""
import json

from django.views.decorators.csrf import csrf_exempt

from accounts.avatar import Avatar
from utils.responses import api_success, api_error, api_bad_request


@csrf_exempt
def get_user_info(request):
    """Get user information."""
    req = request.POST.dict()
    result, user_info = Avatar().get_user_info(req)

    if not result:
        return api_error(user_info, code="USER_NOT_FOUND", status=404)
    return api_success(data=user_info)


@csrf_exempt
def add_user(request):
    """Add a new user."""
    try:
        req = json.loads(request.body)
    except json.JSONDecodeError:
        return api_bad_request("Invalid JSON")

    result, obj_user = Avatar().add_user(req)

    if not result:
        return api_error(obj_user, code="ADD_USER_FAILED")
    return api_success(data={
        "id": obj_user.id,
        "email": obj_user.email,
        "is_active": obj_user.is_active,
    })


@csrf_exempt
def get_user_list(request):
    """Get list of all users."""
    result, user_list = Avatar.get_user_list()

    if not result:
        return api_error("Failed to get user list", code="LIST_FAILED")
    return api_success(data={"users": user_list})


@csrf_exempt
def modify_user(request):
    """Modify user information."""
    try:
        req = json.loads(request.body)
    except json.JSONDecodeError:
        return api_bad_request("Invalid JSON")

    result, content = Avatar().modify_user(req)

    if not result:
        return api_error(content, code="MODIFY_FAILED")
    return api_success(message=content)


@csrf_exempt
def activate_user(request):
    """Activate or deactivate a user."""
    try:
        req = json.loads(request.body)
    except json.JSONDecodeError:
        return api_bad_request("Invalid JSON")

    result, content = Avatar().activate_user(req)

    if not result:
        return api_error(content, code="ACTIVATION_FAILED")
    return api_success(message=content)


@csrf_exempt
def remove_member(request):
    """Remove a member from hosters (keep user account)."""
    req = request.POST.dict()
    result, content = Avatar().remove_member(req)

    if not result:
        return api_error(content, code="REMOVE_MEMBER_FAILED")
    return api_success(message=content)


@csrf_exempt
def delete(request):
    """Delete a user."""
    req = request.POST.dict()
    result, content = Avatar().delete(req)

    if not result:
        return api_error(content, code="DELETE_FAILED")
    return api_success(message=content)
