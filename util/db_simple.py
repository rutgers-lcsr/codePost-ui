from django.contrib.auth.models import User

# Create superuser
james = User.objects.create(username="james@codepost.io", email="james@codepost.io")
james.is_superuser = True
james.set_password('rootabega')
james.save()