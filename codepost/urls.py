"""codepost URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from rest_framework import routers
from rest_framework_jwt.views import obtain_jwt_token, refresh_jwt_token

from core.views.user import UserViewSet
from core.views.course import CourseViewSet
from core.views.submission import SubmissionViewSet
from core.views.assignment import AssignmentViewSet
from core.views.organization import OrganizationViewSet
from core.views.section import SectionViewSet
from core.views.comment import CommentViewSet
from core.views.rubricCategory import RubricCategoryViewSet
from core.views.rubricComment import RubricCommentViewSet
from core.views.file import FileViewSet
from core.views.comment import CommentViewSet
from core.views.rubric import RubricViewSet

router = routers.DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'submissions', SubmissionViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'organizations', OrganizationViewSet)
router.register(r'sections', SectionViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'rubriccategories', RubricCategoryViewSet)
router.register(r'rubriccomments', RubricCommentViewSet)
router.register(r'files', FileViewSet)
router.register(r'comments', CommentViewSet)
router.register(r'rubrics', RubricViewSet)

urlpatterns = [
  path('admin/', admin.site.urls),
  re_path('^api-auth/', include('rest_framework.urls', namespace='rest_framework')),
  re_path('^api/', include(router.urls)),
  path('token-auth/', obtain_jwt_token),
  path('token-refresh/', refresh_jwt_token),
  re_path('core/', include(('core.urls', 'core'), namespace='codepost')),
]

