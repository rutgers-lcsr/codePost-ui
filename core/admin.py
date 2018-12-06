from django.contrib import admin
from core.models import *

# Register your models here.
admin.site.register(Organization)
admin.site.register(Profile)
admin.site.register(Course)
admin.site.register(Section)
admin.site.register(Assignment)
admin.site.register(RubricCategory)
admin.site.register(RubricComment)
admin.site.register(Submission)
admin.site.register(File)
admin.site.register(Comment)