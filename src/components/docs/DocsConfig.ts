export type DocCategory = 'Getting Started' | 'Instructor Workflows' | 'Role Guides' | 'Reference';

export interface DocRoute {
  key: string;
  path: string;
  title: string;
  // We will load content dynamically, but for simplicity in config we just store the path relative to src/docs/content
  fileName: string;
  category: DocCategory;
}

export const docRoutes: DocRoute[] = [
  {
    key: 'overview',
    path: '', // root /docs
    title: 'Overview',
    fileName: 'README.md',
    category: 'Getting Started',
  },
  {
    key: 'getting-started',
    path: 'getting-started',
    title: 'Quick Start',
    fileName: 'getting_started.md',
    category: 'Getting Started',
  },
  {
    key: 'faq',
    path: 'faq',
    title: 'FAQ',
    fileName: 'faq.md',
    category: 'Getting Started',
  },
  {
    key: 'student',
    path: 'student',
    title: 'Student Guide',
    fileName: 'student_guide.md',
    category: 'Role Guides',
  },
  {
    key: 'grader',
    path: 'grader',
    title: 'Grader Guide',
    fileName: 'grader_guide.md',
    category: 'Role Guides',
  },
  {
    key: 'instructor',
    path: 'instructor',
    title: 'Instructor Overview',
    fileName: 'instructor_guide.md',
    category: 'Instructor Workflows',
  },
  {
    key: 'instructor-course-setup',
    path: 'instructor-course-setup',
    title: 'Course Setup & Roster',
    fileName: 'instructor_course_setup.md',
    category: 'Instructor Workflows',
  },
  {
    key: 'instructor-assignment-workflow',
    path: 'instructor-assignment-workflow',
    title: 'Assignment Workflow',
    fileName: 'instructor_assignment_workflow.md',
    category: 'Instructor Workflows',
  },
  {
    key: 'instructor-grading-publishing',
    path: 'instructor-grading-publishing',
    title: 'Grading, Release & Exports',
    fileName: 'instructor_grading_publishing.md',
    category: 'Instructor Workflows',
  },
  {
    key: 'instructor-environment-testing',
    path: 'instructor-environment-testing',
    title: 'Environment & Testing Ops',
    fileName: 'instructor_environment_testing.md',
    category: 'Instructor Workflows',
  },
  {
    key: 'organization',
    path: 'organization',
    title: 'Organization Guide',
    fileName: 'organization_guide.md',
    category: 'Role Guides',
  },
  {
    key: 'submission-upload',
    path: 'submission-upload',
    title: 'Uploading Submissions',
    fileName: 'submission_upload.md',
    category: 'Role Guides',
  },
  {
    key: 'programmatic-comments',
    path: 'programmatic-comments',
    title: 'Programmatic Comments',
    fileName: 'sdk_programmatic_comments.md',
    category: 'Role Guides',
  },
  {
    key: 'features',
    path: 'features',
    title: 'Features',
    fileName: 'features.md',
    category: 'Reference',
  },
  {
    key: 'testing-guide',
    path: 'testing-guide',
    title: 'Testing Guide',
    fileName: 'testing_guide.md',
    category: 'Reference',
  },
];
