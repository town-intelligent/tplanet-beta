"""
User Service - delegates to specialized sub-services.
"""
from . import user_crud
from . import user_group


class UserService:
    """Handles user management operations by delegating to sub-services."""

    # CRUD operations
    def add_user(self, request):
        return user_crud.add_user(request)

    def delete(self, request):
        return user_crud.delete(request)

    def remove_member(self, request):
        return user_crud.remove_member(request)

    def modify_user(self, request):
        return user_crud.modify_user(request)

    def activate_user(self, request):
        return user_crud.activate_user(request)

    # Group operations
    def get_group(self, request):
        return user_group.get_group(request)

    def set_group(self, request):
        return user_group.set_group(request)

    def list_accounts(self, request):
        return user_group.list_accounts(request)
