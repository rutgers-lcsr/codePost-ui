import { message } from 'antd';
import { Assignment } from '../../infrastructure/assignment';
import { Course } from '../../infrastructure/course';
import { SubmissionFile, getFileContent } from '../../infrastructure/file';
import { getHeaders } from '../../infrastructure/generics';
import { Submission } from '../../infrastructure/submission';

import { FAKE_FILES } from './FakeSubmissionData';

export const createFakeSubmission = async (assignmentId: number, sourceSubmissionId?: number) => {
  message.loading(sourceSubmissionId ? 'Cloning submission...' : 'Creating fake submission...', 0);
  try {
    const assignment = await Assignment.read(assignmentId);
    // Always create a new fake student to avoid "student already has submission" errors
    const fakeEmail = `fake_student_${Date.now()}@example.com`;

    try {
      await Course.addToRoster({ id: assignment.course, students: [fakeEmail] } as any);
    } catch (e) {
      console.error(e);
      message.destroy();
      message.error('Failed to add fake student to roster.');
      return;
    }

    const studentEmail = fakeEmail;

    // Create Submission
    const newSubmission = await Submission.create({
      assignment: assignmentId,
      students: [studentEmail],
      isFinalized: false,
      files: [],
    } as any);

    if (sourceSubmissionId) {
      // CLONE MODE: Copy files from source submission
      try {
        // We need to fetch the submission to get file IDs
        // Use readAnonymous to ensure we can read it (if we have access)
        // or just read() if we know we are admin.
        // Since this is a dev tool, assume we have permissions.
        let sourceSubmission: any;
        try {
          sourceSubmission = await Submission.read(sourceSubmissionId);
        } catch {
          // Fallback for graders who might only have anonymous access
          sourceSubmission = await Submission.readAnonymous(sourceSubmissionId);
        }

        if (sourceSubmission && sourceSubmission.files) {
          await Promise.all(
            sourceSubmission.files.map(async (fileOrId: any) => {
              try {
                let fileData: any = {};

                if (typeof fileOrId === 'object' && fileOrId !== null) {
                  // If we already have the object, use it directly
                  fileData = fileOrId;
                } else {
                  // Fetch manually to avoid strict validation errors from FileModel.read
                  const res = await fetch(`${process.env.REACT_APP_API_URL}/files/${fileOrId}/`, {
                    headers: getHeaders(),
                    method: 'GET',
                  });
                  if (res.ok) {
                    fileData = await res.json();
                  } else {
                    throw new Error(`Failed to fetch file ${fileOrId}`);
                  }
                }

                // Use helper or fallback to .data or .code
                const content = getFileContent(fileData) || fileData.data || fileData.code || '';

                await SubmissionFile.create({
                  submission: newSubmission.id,
                  name: fileData.name || 'unknown',
                  extension: fileData.extension || 'txt',
                  data: content,
                  path: fileData.path,
                } as any);
              } catch (err) {
                console.error(`Failed to clone file`, err);
              }
            }),
          );
        }
      } catch (err) {
        console.error('Error reading source submission during clone', err);
        message.error('Failed to read source files.');
      }
    } else {
      // DEFAULT MODE: Create fake files from FAKE_FILES
      await Promise.all(
        Object.keys(FAKE_FILES).map(async (filename) => {
          // @ts-ignore
          const content = FAKE_FILES[filename];
          const extension = filename.split('.').pop() || '';
          await SubmissionFile.create({
            submission: newSubmission.id,
            name: filename,
            extension: extension,
            data: content,
            path: null,
          } as any);
        }),
      );
    }

    message.destroy();
    message.success(sourceSubmissionId ? 'Submission Cloned!' : 'Fake Submission Created!');
  } catch (error) {
    message.destroy();
    message.error('Failed to create submission. See console.');
    console.error(error);
  }
};
