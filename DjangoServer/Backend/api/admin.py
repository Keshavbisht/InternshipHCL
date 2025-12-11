from django.contrib import admin

# Register your models here.
# from django.contrib import admin
from .models import UserExtra, Process, SubProcess, Objective, Document, Video, Image

admin.site.register(UserExtra)
admin.site.register(Process)
admin.site.register(SubProcess)
admin.site.register(Objective)
admin.site.register(Document)
admin.site.register(Video)
admin.site.register(Image)

