// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { message } from 'antd';
import { Assignment } from '../../services/assignment';
import { Course } from '../../services/course';
import { Submission } from '../../services/submission';
import { submissionFilesApi, filesApi } from '../../api-client/clients';
import { getFileContent } from '../../utils/file';

import { FAKE_FILES } from './FakeSubmissionData';

export const createFakeSubmission = async (assignmentId: number, sourceSubmissionId?: number) => {
  message.loading(sourceSubmissionId ? 'Cloning submission...' : 'Creating fake submission...', 0);
  try {
    const assignment = await Assignment.read(assignmentId);
    // Always create a new fake student to avoid "student already has submission" errors
    const fakeEmail = `fake_student_${Date.now()}@example.com`;

    try {
      await Course.addToRoster(assignment.course, { students: [fakeEmail] } as any);
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
        const sourceSubmission = await Submission.read(sourceSubmissionId);

        if (sourceSubmission && sourceSubmission.files) {
          await Promise.all(
            sourceSubmission.files.map(async (fileOrId: any) => {
              try {
                let fileData: any = {};

                if (typeof fileOrId === 'object' && fileOrId !== null) {
                  fileData = fileOrId;
                } else {
                  fileData = await filesApi.retrieve({ id: fileOrId });
                }

                // Use helper or fallback to .data or .code
                const content = getFileContent(fileData) || fileData.data || fileData.code || '';

                await submissionFilesApi.create({
                  submissionFile: {
                    submission: newSubmission.id,
                    name: fileData.name || 'unknown',
                    extension: fileData.extension || 'txt',
                    data: content,
                    path: fileData.path,
                  },
                });
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
          // @ts-expect-error — legacy type incompatibility
          const content = FAKE_FILES[filename];
          const extension = filename.split('.').pop() || '';
          await submissionFilesApi.create({
            submissionFile: {
              submission: newSubmission.id,
              name: filename,
              extension: extension,
              data: content,
              path: null,
            },
          });
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
