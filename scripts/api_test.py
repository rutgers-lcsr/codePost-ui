import requests

BASE_URL = 'http://127.0.0.1:8000/api/'
ADMIN_EMAIL = 'admin@gmail.com'
ADMIN_PWD = 'rootabega'

###############################################################################
# Testing Code
#
###############################################################################

print('')
print('Preparing for your physical...here we go')
print('--------------------------------------')

###############################################################################
# Set up course toplogy for testing.
###############################################################################

print("Setting up course topology.")

# Get course information
r = requests.get(BASE_URL+'courses/1/', auth=(ADMIN_EMAIL, ADMIN_PWD))
if r.status_code == 200:
  course = r.json()

# Set up graders
graders = ['user0@gmail.com', 'user1@gmail.com', 'user2@gmail.com']
payload = {
  'graders' : graders
}

r = requests.patch(BASE_URL+'courses/1/roster/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
if r.status_code == 200:
  if not (r.json()['graders'] == graders):
    print("FAILED")
else:
  print("FAILED")

# Set up students
students = []
for i in range(3, 12):
  students.append('user' + str(i) + '@gmail.com')

payload = {
  'students' : students
}

r = requests.patch(BASE_URL+'courses/1/roster/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
if r.status_code == 200:
  if not (r.json()['students'] == students):
    print("FAILED")
else:
  print("FAILED")

# Set up sections
section0 = [student for student in students[0:3]]
section1 = [student for student in students[3:6]]
section2 = [student for student in students[6:9]]
sections = [
{'name' : "Section 0", 'students' : section0, 'grader' : graders[0]},
{'name' : "Section 1", 'students' : section1, 'grader' : graders[1]},
{'name' : "Section 2", 'students' : section2, 'grader' : graders[2]},
]

for section in sections:
  payload = {
    'name' : section['name'],
    'course' : course['id'],
    'leaders' : section['grader'],
    'students' : section['students'],
  }
  r = requests.post(BASE_URL+'sections/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
  if r.status_code == 201:
    if not (r.json()['students'] == section['students']):
      print("FAILED")
    if not (r.json()['leaders'] == [section['grader']]):
      print("FAILED")
  else:
    print("FAILED")

###############################################################################
# Set up an assignment for testing.
###############################################################################

print("Setting up test assignment.")

helloworld = {
  'name' : 'Hello World',
  'points' : 20,
  'course' : course['id'],
}

r = requests.post(BASE_URL+'assignments/', data=helloworld, auth=(ADMIN_EMAIL, ADMIN_PWD))
if r.status_code != 201:
  print("FAILED")
else:
  assignment = r.json()

rubric = {
  'assignment' : assignment['id'],
  'categories' : [
    {
      'name' : 'style',
      'pointLimit' : 10,
      'comments' : [
        {
          'text' : "Wrong indentation",
          'pointDelta' : -1,
        },
        {
          'text' : "Missing semi-colon",
          'pointDelta' : -2,
        },
      ]
    },
    {
      'name' : 'style',
      'pointLimit' : 10,
      'comments' : [
        {
          'text' : "Wrong indentation",
          'pointDelta' : -1,
        },
        {
          'text' : "Missing semi-colon",
          'pointDelta' : -2,
        },
      ]
    },
  ],
}

for category in rubric['categories']:
  payload = {
    'assignment': rubric['assignment'],
    'name': category['name'],
    'pointLimit': category['pointLimit'],
  }

  r = requests.post(BASE_URL+'rubriccategories/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
  if r.status_code != 201:
    print("FAILED")
  else:
    created = r.json()
    for comment in category['comments']:
      payload = {
        'text': comment['text'],
        'pointDelta' : comment['pointDelta'],
        'category' : created['id'],

      }
      r2 = requests.post(BASE_URL+'rubriccomments/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
      if r2.status_code != 201:
        print("FAILED")

###############################################################################
# Create some submissions
###############################################################################

print("Creating test submissions.")

for student in students:
  file = {
    'name' : 'hello.java',
    'extension' : 'java',
    'code' : "public static void main(String[] args) { System.out.println('Hello, I'm " + student + "!'); }",
  }

  payload = {
    'assignment' : assignment['id'],
    'students' : [student],
  }

  r = requests.post(BASE_URL+'submissions/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
  if r.status_code == 201:
    submission = r.json()
    file['submission'] = submission['id']
    r2 = requests.post(BASE_URL+'files/', data=file, auth=(ADMIN_EMAIL, ADMIN_PWD))
    if r2.status_code != 201:
      print("FAILED")
  else:
    print("FAILED")

###############################################################################
# Assign grader(s) to submissions
###############################################################################

print("Assigning graders.")

# Assign grader
r = requests.get(BASE_URL+'assignments/' + str(assignment['id']) + '/submissions/', auth=(ADMIN_EMAIL, ADMIN_PWD))
if r.status_code == 200:
  submissions = r.json()
else:
  print("FAILED")

for submission in submissions:
  payload = {
    'grader' : graders[0],
  }

  r = requests.patch(BASE_URL+'submissions/' + str(assignment['id']) + '/', data=payload, auth=(ADMIN_EMAIL, ADMIN_PWD))
  if r.status_code != 200:
    print("FAILED")

###############################################################################
# Simulate grading process
###############################################################################

print("Simulating grading process.")

# Grader comments on each assignment.
comment = {
  'text': "Boo",
  'pointDelta': -1,
  'startChar': 4,
  'endChar': 9,
  'startLine': 0,
  'endLine': 0,
  'author' : graders[0],
}

for submission in submissions:
  comment['file'] = submission["files"][0]["id"]
  r = requests.post(BASE_URL+'comments/', data=comment, auth=(graders[0], ADMIN_PWD))
  if r.status_code == 201:
    print(r.json())
  else:
    print(r.text)


# Section leader comments on each assignment.

# Admin deletes grader's comments.

# rubricComment is updated.

# Submissions are finalized.

# Assignment is released.


