from django.urls import path, re_path, include
from django.views.generic import TemplateView
from core import views

urlpatterns = [
  # path('student', views.student, name='student'),
  re_path('.*', TemplateView.as_view(template_name='index.html')),
]
