from django.urls import path
from . import views
# from .views import login_view, register_view, profile_view, list_users


urlpatterns = [
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('profile/', views.profile_view, name='profile'),
    path('users/', views.list_users, name='list_users'),
    path('users/<int:id>/delete/', views.delete_user, name='delete_user'),
    path('users/<int:id>/update/', views.update_user, name='update_user'),
    path('users/<int:id>/toggle-status/', views.toggle_status, name='toggle_status'),
    path("users/<int:id>/role/", views.update_role),


]