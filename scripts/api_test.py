import requests

BASE_URL = 'http://127.0.0.1:8000/api/'

# Representative users
COURSEADMIN_UN = 'james.alb.evans@gmail.com'
GRADER_UN = 'vayyala@gmail.com'
STUDENT_UN = 'user0@gmail.com'
STUDENT_UN2 = 'user1@gmail.com'
PASSWORD = 'rootabega'

# Status Legend
UNAUTHORIZED = 401
FORBIDDEN = 403
NOT_FOUND = 404
SUCCESS = 200

def testAs(url, userType=None):
  r = None
  if userType == "student":
    r = requests.get(BASE_URL+url, auth=(STUDENT_UN, PASSWORD))
  elif userType == "grader":
    r = requests.get(BASE_URL+url, auth=(GRADER_UN, PASSWORD))
  elif userType == "courseadmin":
    r = requests.get(BASE_URL+url, auth=(COURSEADMIN_UN, PASSWORD))
  else:
    r = requests.get(BASE_URL+url)

  return r

###############################################################################
# Testing Code
#
###############################################################################

print('Preparing for colonoscopy...here we go')
print('--------------------------------------')
print('')

###############################################################################
# Users Endpoint
###############################################################################

print('Testing /users/ endpoint...')

print('Test 1: /me/')
TEST_URLS = ['users/me/']

r = testAs(TEST_URLS[0], userType=None)
if r.status_code != UNAUTHORIZED:
  print('FAIL')
r = testAs(TEST_URLS[0], userType="courseadmin")
if r.json()['email'] != COURSEADMIN_UN:
  print('FAIL')

print('--------------------------------------')
print('')

###############################################################################
# Assignments Endpoint
###############################################################################

print('Testing /assignments/ endpoint...')

TEST_URLS = ['assignments/1/',
'assignments/1/toggleReleased/',
'assignments/1/drawUnassigned/',
'assignments/1/submissions/',
'assignments/1/submissions/?student=' + STUDENT_UN,
'assignments/1/submissions/?student=' + "MALFORMED0x0",
'assignments/1/submissions/?grader=' + GRADER_UN,
'assignments/1/submissions/?grader=' + "MALFORMED0x0",
]

print('Test 1: /toggleReleased/')

r = requests.get(BASE_URL+TEST_URLS[0])
isReleased = r.json()['isReleased']

# Try unauthorized login
r = requests.patch(BASE_URL+TEST_URLS[1])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as student (unpermissioned)
r = requests.patch(BASE_URL+TEST_URLS[1], auth=(STUDENT_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as grader (unpermissioned)
r = requests.patch(BASE_URL+TEST_URLS[1], auth=(GRADER_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as course admin (ermissioned)
r = requests.patch(BASE_URL+TEST_URLS[1], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')
if r.json()['isReleased'] is isReleased:
  print('FAIL')

###############################################################################

print('Test 2: /drawUnassigned/')

# Try unauthorized login
r = requests.patch(BASE_URL+TEST_URLS[2])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as student (unpermissioned)
r = requests.patch(BASE_URL+TEST_URLS[2], auth=(STUDENT_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as grader (permissioned)
r = requests.patch(BASE_URL+TEST_URLS[2], auth=(GRADER_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')
if r.json()['grader']['username'] != GRADER_UN:
  print('FAIL')

# Try as course admin (unpermissioned)
r = requests.patch(BASE_URL+TEST_URLS[2], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

###############################################################################

print('Test 3: /submissions/')

# Try unauthorized login
r = requests.get(BASE_URL+TEST_URLS[3])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as student (unpermissioned)
r = requests.get(BASE_URL+TEST_URLS[3], auth=(STUDENT_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as grader (permissioned)
r = requests.get(BASE_URL+TEST_URLS[3], auth=(GRADER_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as course admin (unpermissioned)
r = requests.get(BASE_URL+TEST_URLS[3], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')
if len(r.json()) != 50:
  print('FAIL')

###############################################################################

print('Test 4: /submissions/?student={student}')

# Try unauthorized login
r = requests.get(BASE_URL+TEST_URLS[4])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as student we are querying about (permissioned)
r = requests.get(BASE_URL+TEST_URLS[4], auth=(STUDENT_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')
if r.json()[0]['id'] != 1:
  print('FAIL')
if r.json()[0]['isFinalized'] != False:
  print('FAIL')
requests.patch(BASE_URL+TEST_URLS[1], auth=(COURSEADMIN_UN, PASSWORD))

# Try as a different student (not permissioned)
r = requests.get(BASE_URL+TEST_URLS[4], auth=(STUDENT_UN2, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as grader of this submission
r = requests.get(BASE_URL+TEST_URLS[4], auth=(GRADER_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')
if r.json()[0]["id"] != 1:
  print('FAIL')

# Try as a courseadmin of this submission
r = requests.get(BASE_URL+TEST_URLS[4], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')
if r.json()[0]["id"] != 1:
  print('FAIL')

###############################################################################

print('Test 5: /submissions/?student={student} - malformed input')

# Try unauthorized login
r = requests.get(BASE_URL+TEST_URLS[5])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as a student
r = requests.get(BASE_URL+TEST_URLS[5], auth=(STUDENT_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as a grader
r = requests.get(BASE_URL+TEST_URLS[5], auth=(GRADER_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as a courseadmin of this submission
r = requests.get(BASE_URL+TEST_URLS[5], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != NOT_FOUND:
  print('FAIL')

###############################################################################

print('Test 6: /submissions/?grader={grader}')

# Try unauthorized login
r = requests.get(BASE_URL+TEST_URLS[6])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as student we are querying about (permissioned)
r = requests.get(BASE_URL+TEST_URLS[6], auth=(STUDENT_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as the grader we are querying about
r = requests.get(BASE_URL+TEST_URLS[6], auth=(GRADER_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')

# Try as a courseadmin of this submission
r = requests.get(BASE_URL+TEST_URLS[6], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != SUCCESS:
  print('FAIL')

###############################################################################

print('Test 7: /submissions/?grader={grader} -- malformed input')

# Try unauthorized login
r = requests.get(BASE_URL+TEST_URLS[7])
if r.status_code != UNAUTHORIZED:
  print('FAIL')

# Try as student we are querying about (permissioned)
r = requests.get(BASE_URL+TEST_URLS[7], auth=(STUDENT_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as the grader we are querying about
r = requests.get(BASE_URL+TEST_URLS[7], auth=(GRADER_UN, PASSWORD))
if r.status_code != FORBIDDEN:
  print('FAIL')

# Try as a courseadmin of this submission
r = requests.get(BASE_URL+TEST_URLS[7], auth=(COURSEADMIN_UN, PASSWORD))
if r.status_code != NOT_FOUND:
  print('FAIL')

###############################################################################

print('--------------------------------------')
print('')