# Frequently Asked Questions

## Missing Email

If you're not receiving emails from codePost, here are some things to check:

### Check Your Spam/Junk Folder

Sometimes emails from new senders get filtered into spam. Search for emails from `codepost` in your spam folder.

### Check the Email Address

Make sure the email address you used to sign up matches the one your instructor added to the course roster. Ask your instructor to verify your email in the roster.

### Institutional Email Filters

Some universities have strict email filters. Contact your IT department if emails are consistently not arriving.

### Request a New Email

If you're trying to reset your password or verify your account, try requesting the email again after a few minutes.

> [!TIP]
> Add `codepost` to your contacts or safe senders list to ensure emails arrive in your inbox.

---

## Roles in codePost

codePost has several user roles with different permissions:

### Student

- View enrolled courses
- Submit assignments (when allowed)
- View graded feedback

### Grader

- All student permissions
- Grade assigned submissions
- Add comments
- View submissions for their assigned section

### Grader (Rubric)

- All grader permissions
- Edit rubric items from console or code review

### Supergrader

A **Supergrader** is a special type of grader with elevated permissions:

- Can grade any submission (not limited to assigned sections)
- Can view anonymized submissions
- Useful for TAs who need to help across multiple sections

To make a grader a supergrader, go to **Roster > Graders** and toggle the "Supergrader" option.

> [!NOTE]
> Supergraders cannot modify course settings or assignments. Only Admins have those permissions.

### Admin (Instructor)

- All grader permissions
- Create and manage assignments
- Manage course roster
- Configure grading settings
- View all submissions
- Publish grades

### Orangization Admin

- All Admin permissions
- Create and manage Courses
- Edit SSO settings for an Organzation
- Can view all Users in an Organzation
- Can view all Courses in an Organzation

---

## Account Issues

### How do I reset my password?

1. Go to the login page
2. Click "Forgot Password"
3. Enter your email address
4. Check your inbox for the reset link

### How do I change my email?

Contact your course instructor or organization administrator to update your email address.

### Why can't I see my course?

- Make sure you're using the correct email address
- Ask your instructor to verify you're added to the roster
- Check if you need to use an invite code to join

## Running Assignments

### Failed to create Docker container

Sometimes the environment cannot be built on codePost, this is usually due to a misconfiguration in the assignment.
Containers can file for a couple of reasons, which can be one of the following.

1. Misaligned dataset mounts
   - Datasets are a bit tricky to get right, datasets which are mounted improerly can cause build to fail.
   - Check if your mounting the dataset in the correct location, its common to mistakely mount it as a directory, causing addicational mounts to fail.
2. Unavilable Docker containers,
   - If docker hub is down, or if we are unable to pull the image, the build will fail.
3. Unsupported configuration due to limitations of the docker sandbox
   - If you have a configuration which is not yet supported please reach out to our team.
   - We recommend not using external links such as http requests inside student code, as every time the code executes it will download.
