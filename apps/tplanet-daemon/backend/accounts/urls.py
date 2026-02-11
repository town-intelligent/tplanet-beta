from django.urls import path
from . import views

urlpatterns = [
    path("signup", views.sign_up),
    path("signin", views.sign_in),
    path("verify_jwt", views.verify_jwt),
    path("forgot_password", views.forgot_password),
    path("get_group", views.get_group),
    path("set_group", views.set_group),
    path("list_accounts", views.list_accounts),
    path("remove_member", views.remove_member),
    path("delete", views.delete),
    path("oauth/google", views.google_login),
    path("reset_password", views.reset_password),
    path("get_user_info", views.get_user_info),
    path("add_user", views.add_user),
    path("get_user_list", views.get_user_list),
    path("registration_stats", views.registration_stats),
    path("get_user_login_records", views.get_user_login_records),
    path("modify_user", views.modify_user),
    path("activate_user", views.activate_user),
    path("impersonate", views.impersonate),
]
