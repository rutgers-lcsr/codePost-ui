// @ts-nocheck
// Auto-generated from core/permissions/capabilities.py — do not edit manually.
// Re-generate by running: ./scripts/generate_ts_client.sh

export type Capability =
  | 'view_course'
  | 'edit_course_settings'
  | 'manage_roster'
  | 'view_roster'
  | 'manage_sections'
  | 'view_analytics'
  | 'configure_ai'
  | 'view_ai_usage'
  | 'create_assignment'
  | 'claim_submissions'
  | 'view_audit_log'
  | 'change_invite_code'
  | 'manage_course_api_keys'
  | 'edit_assignment'
  | 'copy_assignment'
  | 'view_assignment'
  | 'edit_rubric'
  | 'view_rubric'
  | 'release_grades'
  | 'manage_extensions'
  | 'view_queue'
  | 'manage_test_cases'
  | 'view_assignment_statistics'
  | 'upload_submission'
  | 'generate_ai_test_cases'
  | 'manage_datasets'
  | 'download_assignment_files'
  | 'view_submission'
  | 'view_feedback'
  | 'grade_submission'
  | 'comment_on_submission'
  | 'finalize_submission'
  | 'unfinalize_submission'
  | 'view_student_identity'
  | 'request_regrade'
  | 'manage_regrades'
  | 'run_autograder'
  | 'run_code'
  | 'generate_ai_comments'
  | 'manage_partners'
  | 'notify_students_feedback'
  | 'view_ai_assistance'
  | 'trigger_ai_assistance'
  | 'manage_global_templates'
  | 'view_submission_history'
  | 'provide_comment_feedback'
  | 'create_course'
  | 'manage_organization'
  | 'impersonate_user'
  | 'access_admin_dashboard';

export type Capabilities = Partial<Record<Capability, boolean>>;

export const CAPABILITY_DESCRIPTIONS: Record<Capability, string> = {
  view_course: 'View the course dashboard and basic course information.',
  edit_course_settings: 'Modify course configuration such as name, period, grading options, and deadlines.',
  manage_roster: 'Add or remove students, graders, and course admins from the course roster.',
  view_roster: 'View the list of students and staff enrolled in the course.',
  manage_sections: 'Create, edit, or delete sections and assign section leaders.',
  view_analytics: 'Access course-level analytics, grade distributions, and grading progress dashboards.',
  configure_ai: 'Enable, disable, or configure AI-powered feedback settings for the course.',
  view_ai_usage: 'View AI credit usage and generation history for the course.',
  create_assignment: 'Create new assignments within the course.',
  claim_submissions: 'Claim ungraded submissions from the grading queue.',
  view_audit_log: 'View and export the course-level audit log of student and grader activity.',
  change_invite_code: 'Regenerate the course join invite code.',
  manage_course_api_keys: 'Create, revoke, and manage course-scoped API keys.',
  edit_assignment: 'Modify assignment settings including name, deadlines, point values, and visibility.',
  copy_assignment: "Duplicate an assignment's configuration, rubric, and test cases to another course.",
  view_assignment: 'View the assignment and its associated submissions.',
  edit_rubric: 'Create, modify, or delete rubric categories, comments, and point values.',
  view_rubric: 'View the rubric structure and comments.',
  release_grades: 'Toggle feedback release so students can view their grades and comments.',
  manage_extensions: 'Grant deadline extensions to individual students or groups.',
  view_queue: 'View the grading queue and assignment completion statistics.',
  manage_test_cases: 'Create, edit, or sync autograder test cases and test categories.',
  view_assignment_statistics: 'View detailed grade distributions and grading statistics for an assignment.',
  upload_submission: 'Upload files to create or update a submission.',
  generate_ai_test_cases: 'Use AI to generate new test scripts based on solution or starter code.',
  manage_datasets: 'Upload, edit, or delete datasets mounted during code execution.',
  download_assignment_files: 'Download instructor-provided assignment files as a ZIP.',
  view_submission: 'View the submission files.',
  view_feedback: 'View grades, comments, and rubric applications on a submission.',
  grade_submission: 'Add or edit grades, apply rubric comments, and finalize submissions.',
  comment_on_submission: 'Create, edit, or delete inline code comments on a submission.',
  finalize_submission: 'Mark a submission as fully graded and ready for release.',
  unfinalize_submission: 'Revert a finalized submission back to in-progress for further grading.',
  view_student_identity: 'See the real names and emails of students on a submission (bypasses anonymous grading).',
  request_regrade: 'Submit a regrade request on a finalized submission.',
  manage_regrades: 'Review, approve, or reject regrade requests.',
  run_autograder: 'Execute autograder test cases against a submission.',
  run_code: 'Execute submission code in the sandboxed environment.',
  generate_ai_comments: 'Trigger AI-powered comment generation on a submission.',
  manage_partners: 'Create or remove partner links on a submission.',
  notify_students_feedback: 'Send an email notification to students that their feedback is ready.',
  view_ai_assistance: 'View AI-generated grading summaries and suggested comments.',
  trigger_ai_assistance: 'Manually trigger or regenerate AI grading assistance on a submission.',
  manage_global_templates: 'Promote pinned comments to global templates visible to all graders.',
  view_submission_history: 'View the full history of views and actions on a submission.',
  provide_comment_feedback: 'Rate rubric comments with thumbs up or down feedback.',
  create_course: 'Create new courses within an organization.',
  manage_organization: 'Edit organization settings, SSO configuration, and default course options.',
  impersonate_user: 'Log in as another user for debugging and support.',
  access_admin_dashboard: 'Access the platform-wide administration dashboard.',
};
