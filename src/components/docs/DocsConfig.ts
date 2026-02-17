export type DocCategory = 'Getting Started' | 'Guides' | 'Reference';

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
    category: 'Guides',
  },
  {
    key: 'instructor',
    path: 'instructor',
    title: 'Instructor Guide',
    fileName: 'instructor_guide.md',
    category: 'Guides',
  },
  {
    key: 'organization',
    path: 'organization',
    title: 'Organization Guide',
    fileName: 'organization_guide.md',
    category: 'Guides',
  },
  {
    key: 'submission-upload',
    path: 'submission-upload',
    title: 'Uploading Submissions',
    fileName: 'submission_upload.md',
    category: 'Guides',
  },
  {
    key: 'programmatic-comments',
    path: 'programmatic-comments',
    title: 'Programmatic Comments',
    fileName: 'sdk_programmatic_comments.md',
    category: 'Guides',
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
