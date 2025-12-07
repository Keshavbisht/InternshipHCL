from django.db import models

# Create your models here.
# from django.db import models
from django.contrib.auth.models import User

# Extend the User model to include extra fields
class UserExtra(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('user', 'User'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="extra")
    phone = models.CharField(max_length=20, null=True, blank=True)
    # address = models.CharField(max_length=255, null=True, blank=True)
    # age = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='inactive')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    
    assigned_processes = models.JSONField(default=list, blank=True, null=True)
    assigned_subprocesses = models.JSONField(default=list, blank=True, null=True)

    def __str__(self):
        return self.user.username
    
# PROCESS TABLE MODEL
class Process(models.Model):
    process_id = models.AutoField(primary_key=True)
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    process_name = models.CharField(max_length=100, unique=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')

    created_at = models.DateTimeField(auto_now_add=True)  
    updated_at = models.DateTimeField(auto_now=True)      

    def __str__(self):
        return self.process_name


# SUB PROCESS TABLE MODEL
class SubProcess(models.Model):
    subprocess_id = models.AutoField(primary_key=True)

    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    )

    # 🔵 Process dropdown (FK)
    process = models.ForeignKey(
        Process,
        on_delete=models.CASCADE,
        related_name="subprocesses"
    )

    subprocess_name = models.CharField(max_length=200)

    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active')


    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.process.process_name} → {self.subprocess_name}"


