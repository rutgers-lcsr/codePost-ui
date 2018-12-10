import requests

BASE_URL = 'http://127.0.0.1:8000/api/'

###############################################################################
# Testing Code
#
###############################################################################

print('')
print('Preparing for your physical...here we go')
print('--------------------------------------')

PASSWORD = 'rootabega'

ADMIN_EMAIL = 'admin@gmail.com'
GRADER_EMAIL = 'user0@gmail.com'
SECTION_LEADER_EMAIL = 'user1@gmail.com'
PARTNER1_EMAIL = 'user2@gmail.com'
PARTNER2_EMAIL = 'user3@gmail.com'
OTHER_STUDENT_EMAIL = 'user4@gmail.com'
USERS = [ADMIN_EMAIL, GRADER_EMAIL, SECTION_LEADER_EMAIL, PARTNER1_EMAIL, PARTNER2_EMAIL, OTHER_STUDENT_EMAIL]

###############################################################################
# Set up course toplogy for testing.
###############################################################################

print("Setting up course topology.")

# Get course information
r = requests.get(BASE_URL+'courses/1/', auth=(ADMIN_EMAIL, PASSWORD))
if r.status_code != 200:
  print("FAILED: failed to retrieve course.")
course = r.json()

# Set up roster
payload = {
  'graders' : [GRADER_EMAIL, SECTION_LEADER_EMAIL],
  'students' : [PARTNER1_EMAIL, PARTNER2_EMAIL, OTHER_STUDENT_EMAIL]
}

r = requests.patch(BASE_URL+'courses/' + str(course['id']) + '/roster/', data=payload, auth=(ADMIN_EMAIL, PASSWORD))
if r.status_code != 200:
  print("FAILED: failed updating roster")

###############################################################################
# Testing course object.
###############################################################################

# GET test
i = 0
expected_behavior = [200, 200, 200, 200, 200, 200]
for user in USERS:
  r = requests.get(BASE_URL+'courses/' + str(course['id']) + '/', auth=(user, PASSWORD))
  if r.status_code != expected_behavior[i]:
    print("FAILED: GET Course permissions")
    print(r.text)
  i += 1

# PATCH test
i = 0
expected_behavior = [200, 403, 403, 403, 403, 403]
payload = {
  'name' : "COS201",
}
for user in USERS:
  r = requests.patch(BASE_URL+'courses/' + str(course['id']) + '/', data=payload, auth=(user, PASSWORD))
  if r.status_code != expected_behavior[i]:
    print("FAILED: PATCH Course permissions")
    print(r.status_code)
  i += 1

# Reset name
payload = {
  'name' : "COS201",
}
r = requests.get(BASE_URL+'courses/' + str(course['id']) + '/', data=payload, auth=(ADMIN_EMAIL, PASSWORD))

###############################################################################
# Testing section object.
###############################################################################

