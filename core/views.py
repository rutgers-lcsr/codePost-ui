from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import viewsets
from core.serializers import UserSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer