"""Avatar - Legacy compatibility wrapper. Use AuthService/UserService/ProfileService directly."""
from accounts.services import AuthService, UserService, ProfileService


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


class Avatar:
    """Legacy Avatar class - delegates to service classes."""

    def __init__(self, username=None):
        self._auth = AuthService()
        self._user = UserService()
        self._profile = ProfileService()

    def signup(self, request):
        return self._auth.signup(request)

    def signin(self, req):
        return self._auth.signin(req)

    def verify_jwt(self, username, jwt_token):
        return self._auth.verify_jwt(username, jwt_token)

    def oauth_google(self, request):
        return self._auth.oauth_google(request)

    def forgot_password(self, request):
        return self._auth.forgot_password(request)

    def reset_password(self, request):
        return self._auth.reset_password(request)

    def impersonate(self, request, current_user):
        return self._auth.impersonate(request, current_user)

    def add_user(self, request):
        return self._user.add_user(request)

    def delete(self, request):
        return self._user.delete(request)

    def remove_member(self, request):
        return self._user.remove_member(request)

    def modify_user(self, request):
        return self._user.modify_user(request)

    def activate_user(self, request):
        return self._user.activate_user(request)

    def get_group(self, request):
        return self._user.get_group(request)

    def set_group(self, request):
        return self._user.set_group(request)

    def list_accounts(self, request):
        return self._user.list_accounts(request)

    def get_user_info(self, request):
        return self._profile.get_user_info(request)

    @staticmethod
    def get_user_list():
        return ProfileService.get_user_list()

    @staticmethod
    def get_user_login_records(req):
        return ProfileService.get_user_login_records(req)

    def registration_stats(self):
        return self._profile.registration_stats()
