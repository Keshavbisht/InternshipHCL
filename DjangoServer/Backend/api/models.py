from django.db import models

# Create your models here.
# from django.db import models
from django.contrib.auth.models import User

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

    def __str__(self):
        return self.user.username

