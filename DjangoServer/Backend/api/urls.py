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
    
    # PROCESS ROUTES
    path('process/create/', views.create_process),
    path('process/list/', views.list_processes),
    path('process/<int:id>/update/', views.update_process),
    path('process/<int:id>/delete/', views.delete_process),
    # SUBPROCESS ROUTES
    path('subprocess/create/', views.create_subprocess),
    path('subprocess/list/', views.list_subprocesses),
    path('subprocess/<int:id>/update/', views.update_subprocess),
    path('subprocess/<int:id>/delete/', views.delete_subprocess),
    
    path('users/<int:user_id>/assignments/', views.get_user_assignments, name='get_user_assignments'),
    path('users/<int:user_id>/assign/', views.assign_processes_to_user, name='assign_processes'),

    # ---------------- OBJECTIVES ----------------
    path('objective/create/', views.create_objective),
    path('objective/list/', views.list_objectives),
    path('objective/<int:id>/update/', views.update_objective),
    path('objective/<int:id>/delete/', views.delete_objective),

    # ---------------- DOCUMENTS ----------------
    path('document/upload/', views.upload_document),
    path('document/<int:objective_id>/list/', views.list_documents),
    path('document/<int:id>/delete/', views.delete_document),

    # ---------------- VIDEOS ----------------
    path('video/create/', views.create_video),
    path('video/<int:objective_id>/list/', views.list_videos),
    path('video/<int:id>/delete/', views.delete_video),

    # ---------------- IMAGES ----------------
    path('image/upload/', views.upload_image),
    path('image/<int:objective_id>/list/', views.list_images),
    path('image/<int:id>/delete/', views.delete_image),



]