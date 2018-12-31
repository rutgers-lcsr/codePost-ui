from core.models import User, Organization

# Create organization
princeton = Organization.objects.create(name='Princeton', shortname='pton')

# Create superuser
james = User.objects.create(username="james@codepost.io", email="james@codepost.io")
james.is_superuser = True
james.profile.organization = princeton
james.set_password('rootabega')
james.save()

