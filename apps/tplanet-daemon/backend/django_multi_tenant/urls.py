# django_multi_tenant/urls.py
from django.urls import path
from django_multi_tenant import views

urlpatterns = [
    path('config', views.tenant_config, name='tenant_config'),
    path('admin-config', views.admin_config, name='admin_config'),
    path('list', views.tenant_list, name='tenant_list'),
    path('create', views.tenant_create, name='tenant_create'),
    path('upload', views.upload_image, name='tenant_upload'),
    path('validate/<str:tenant_id>', views.validate_tenant_id, name='validate_tenant_id'),
    path('dns/create', views.create_subdomain, name='create_subdomain'),
    path('dns/<str:subdomain>', views.delete_subdomain, name='delete_subdomain'),
    path('dns/check/<str:subdomain>', views.check_subdomain, name='check_subdomain'),
    path('<str:tenant_id>', views.tenant_detail, name='tenant_detail'),
]
