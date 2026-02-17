# Instructor Guide

## Course Setup

1. **Create a Course**: From the main dashboard, create a new course by providing a name, period (e.g., "Fall 2023"), and course code.
2. **Settings**: Navigate to **Course Settings > General** to configure default settings like submission allowances and timezone.

## Managing Roster

To add users to your course:

1. Go to **Roster**.
2. Select the tab for the role you want to add (**Students**, **Graders**, or **Admins**).
3. **Add (Invite)**:
   - You can invite users by email.
   - Or allow them to join using an **Invite Code**.
4. **Sections**: You can organize students into sections for better management.

## Creating Assignments

1. Go to **Assignments > Overview**.
2. Click **New Assignment**.
3. **Configure**:
   - **Name**: Assignment title.
   - **Points**: Total points available.
   - **Submission Settings**: Allow student uploads, set file types, etc.
   - **Deadlines**: Set due dates and late policies.

## Grading (Code Console)

The Code Console is where grading happens.

### Viewing Submissions

Navigate to `Submissions` in the sidebar. You have two views:

- **By Student**: Lists all students and their submission status. Use the search bar to find a specific student.
- **By Grader**: Lists submissions grouped by the graders assigned to them.

Each submission has a status:

- **Unfinalized**: The submission is still being graded.
- **Finalized**: Grading is complete for this submission.

### Grading a Submission

1. Click on a student's name or submission to open the **Code Console**.
2. **Review Code**:
   - Click lines of code to add **Inline Comments**.
   - Use the **Rubric** sidebar to apply predefined point deductions/additions.
3. **Finalize**: Click the "Finalize" button when grading is complete for this submission.

### Publishing Grades

Grades are not visible to students until you **Publish** them.

- Go to `Assignments > Overview`.
- Click the **Publish** button next to an assignment to release all finalized grades and feedback to students.

### Exporting Grades

To download grades for your records:

1. Go to `Course Settings` or `Assignments > Overview`.
2. Click **Download Grades**.
3. A CSV file with all student scores will be generated.

## Auto-Run Environment

codePost supports running submitted code to generate output. This is **not** traditional autograding (PASS/FAIL tests), but rather a system for _executing_ student code and displaying the results.

For script-based test syntax and examples, see the [Testing Guide](/docs/testing-guide).

### What is Auto-Run?

Auto-Run allows instructors to:

- Define a runtime environment (Python, Java, etc.)
- Specify how to compile and run student submissions
- Display the console output to both students and graders

This is useful for:

- Showing students what their program produces
- Helping graders quickly see program behavior
- Running code against sample inputs

### Configuring the Environment

1. Go to `Assignments > Environment Setup`.
2. **Select Language**: Choose the programming language for this assignment.
3. **Build/Run Commands**: (Planned) Define how to compile (if needed) and execute the code.
   - For Python: Just specify the entry file (e.g., `python main.py`)
   - For Java: Specify compile (`javac *.java`) and run commands (`java Main`)
4. **Input Files** (Optional): Upload test input files that will be fed to the program.
5. **Timeout**: Set a maximum execution time to prevent infinite loops.

#### Environment Detection

Environments are detected through an algorithm which looks at assignment files and attempts to infer the language and build/run commands. We recommend using the Auto Detect Environment Mode for most assignments unless you need a specific environment. Auto Detect Environment also will detect libaray based on the language which are used in the files.

> [!NOTE]
> Environment Detection is limited to checking for the most recent version of libaries and languages. Codepost will work to update these as the languages change.

#### Environment Build

Environment builds are docker containers which are used to run the code. These will include on runtime, Additional files from the assignment and any submitted files. Additionally any datasets (files which arent include in the assignment such as large csv or binaries) will be mounted into the container. This is to prevent the container from being too large and to allow for the use of large files. It also allows you to edit the files in the container without needing to do the environment. You can move datasets mounts and all future runs will mount the dataset in that location.

Environment builds in Auto Detection mode will take into account Module not found errors and Query the repos to find the latest version of the module. This is incase we were able to detect a module from the assignment files. Auto Detection will investigate the submitted file from the students, if multiple submissions have a miss module, it will take the latest version of the module and add it to the docker environment.

### Viewing Outputs

When a student submits their work:

1. The system automatically runs the code using the configured environment.
2. The **Output** is captured and stored.
3. In the **Code Console**, graders and students (if cached) can view the output in a dedicated panel.

> [!NOTE]
> Auto-Run does not perform automated grading. Graders must manually review the output and assign scores using the Rubric.

### Caching

For efficiency, outputs are cached. If the same code is run again without changes, the cached result is displayed instead of re-executing. Graders can force a re-run if needed.
