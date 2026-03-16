// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { FC, useState, useEffect, useCallback } from 'react';
import { Divider, Modal, Progress, Steps } from 'antd';
import {
  getSubforStudent,
  isEqual,
  processSubmissionsFromFiles,
  STUDENT_STATUS,
  UPLOAD_STATUS,
} from './BulkUploadHelpers';
import { colors } from '../../../../../../theme/colors';

import { SubmissionInfoType, UploadFile } from '../../../../../../types/common';
import { Course } from '../../../../../../api-client';
import { Assignment } from '../../../../../../types/common';
import { BulkUploadComplete, BulkUploadFooter, BulkUploadHeader, BulkUploadNoStudents } from './BulkUploadComponents';
import BulkUploadConfirm from './BulkUploadConfirm';
import UploadForm from './UploadForm';
import { INTEGRATIONS } from '../../../../../landing/Integrations';
import { codePostFile, IProtoFileUpload, IProtoSubmission, readUploadedFile } from './../FileReader';

interface IProps {
  isVisible: boolean;
  onCancel: () => void;
  assignment: Assignment;
  submissions: SubmissionInfoType[];
  students: string[];
  uploadSubmission: (assignment: Assignment, partners: string[], files: UploadFile[]) => Promise<SubmissionInfoType>;
  updateSubmission: (submission: SubmissionInfoType) => Promise<void>;
  deleteSubmission: (submission: SubmissionInfoType) => Promise<void>;
  showImportOptions?: boolean;
  course: Course;
}

enum STATUS {
  NONE,
  UPLOADED,
  READING,
  UPLOADING,
  FILE_ERROR,
  COMPLETE,
}

const BulkUpload: FC<IProps> = (props) => {
  const {
    isVisible,
    onCancel,
    assignment,
    submissions,
    students,
    uploadSubmission,
    updateSubmission,
    deleteSubmission,
    course,
  } = props;

  const [protoSubmissions, setProtoSubmissions] = useState<IProtoSubmission[]>([]);
  const [studentMap, setStudentMap] = useState<{ [student: string]: STUDENT_STATUS }>({});
  const [uploadMap, setUploadMap] = useState<{ [student: string]: UPLOAD_STATUS }>({});
  const [fileMap, setFileMap] = useState<{ [submitters: string]: { [fileName: string]: string | ArrayBuffer | null } }>(
    {},
  );
  const [status, setStatus] = useState<STATUS>(STATUS.NONE);
  const [numUploaded, setNumUploaded] = useState(0);
  const [numFiles, setNumFiles] = useState(0);
  const [overwriteMode, setOverwriteMode] = useState(false);
  const [errorPaths, setErrorPaths] = useState<string[]>([]);
  const [mode, setMode] = useState<string | undefined>(undefined);
  const [showImportOptions, setShowImportOptions] = useState(props.showImportOptions ?? false);

  // Helper to build student map
  const buildNewStudentMap = useCallback((studentList: string[], submissionList: SubmissionInfoType[]) => {
    const newMap: Record<string, STUDENT_STATUS> = {};
    for (const student of studentList) {
      newMap[student.toLowerCase()] = STUDENT_STATUS.MISSING;
    }
    if (submissionList) {
      for (const submission of submissionList) {
        if (submission.students) {
          for (const student of submission.students) {
            if (student) {
              newMap[student.toLowerCase()] = STUDENT_STATUS.EXISTING;
            }
          }
        }
      }
    }
    return newMap;
  }, []);

  // Initialize student map
  useEffect(() => {
    setStudentMap(buildNewStudentMap(students, submissions));
  }, [students, submissions, buildNewStudentMap]);

  // Methods
  const handleCancelClick = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // clearFiles is available if needed for reset functionality

  const updateProtoSubmissions = useCallback((protos: IProtoSubmission[], nFiles: number, errors: string[]) => {
    setProtoSubmissions(protos);
    setFileMap({});
    setNumFiles(nFiles);
    setErrorPaths(errors);
  }, []);

  const handleUpdateImportOptions = useCallback((show: boolean) => {
    if (!show) {
      setShowImportOptions(false);
      setMode(undefined);
    } else {
      setShowImportOptions(show);
    }
  }, []);

  const onIntegrationClick = useCallback((newMode?: string) => {
    setMode(newMode);
    setShowImportOptions(false);
  }, []);

  const toggleOverwriteMode = useCallback(() => {
    setOverwriteMode((prev) => !prev);
  }, []);

  // Upload Logic

  // Note: Upload logic is now consolidated in performUploadWithMap

  const handleOverwrite = useCallback(async () => {
    const toChange: SubmissionInfoType[] = [];
    students.forEach((student) => {
      const newSubmission = getSubforStudent(student, protoSubmissions);

      if (newSubmission !== undefined && newSubmission.isCollision) {
        const match = submissions.find((sub) => {
          return (sub.students as (string | null)[]).some((el) => {
            return el && isEqual(el, student);
          });
        });

        if (match) {
          const reMatch = toChange.find((el) => {
            return el.id === match.id;
          });

          if (reMatch) {
            reMatch.students = reMatch.students.filter((el) => {
              return el && !isEqual(el, student);
            }) as string[];
          } else {
            const newSub = { ...match };
            newSub.students = (newSub.students as (string | null)[]).filter((el) => {
              return el && !isEqual(el, student);
            }) as string[];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            toChange.push(newSub as any);
          }
        }
      }
    });

    const promises = toChange.map((sub) => {
      if (sub.students.length === 0) {
        return deleteSubmission(sub);
      } else {
        return updateSubmission(sub);
      }
    });

    return Promise.all(promises);
  }, [students, protoSubmissions, submissions, deleteSubmission, updateSubmission]);

  // Revised readFiles to be more robust
  const performReadAndUpload = useCallback(async () => {
    // We set status READING
    setStatus(STATUS.READING);

    // Use a local variable to accumulate files to ensure we have the full data for upload
    // BUT we also want to update state so UI shows progress if implemented?
    // Original UI has READING progress bar based on fileMap size.
    // So we MUST update state.

    // To safely proceed to upload after all `setFileMap` calls, we can await the Promise.all.
    // However, the state updates might not be flushed yet in the next line.
    // React state updates are batched.

    // Actually, we can just accumulate `allFiles` locally AND update state.
    // Then pass `allFiles` to `performUpload` (modified to accept fileMap).

    const localFileMap: { [submitters: string]: { [fileName: string]: string | ArrayBuffer | null } } = {};

    await Promise.all(
      protoSubmissions.map(async (submission) => {
        const submitters = submission.students.join(',');
        localFileMap[submitters] = localFileMap[submitters] || {};

        for (const file of submission.files) {
          try {
            let outputFiles;
            if ('file' in file && file.file) {
              outputFiles = await readUploadedFile(file.file as File | Blob);
            } else {
              outputFiles = await readUploadedFile(file as unknown as File | Blob);
            }

            if (file.type === 'application/zip' || ['.zip'].includes(file.name)) {
              outputFiles.forEach((outputFile: IProtoFileUpload) => {
                const fullName = `anydirname/${submission.students.join(',')}/${outputFile.longname}`;
                localFileMap[submitters][fullName] = outputFile.data;
              });
            } else {
              outputFiles.forEach((outputFile: IProtoFileUpload) => {
                localFileMap[submitters][outputFile.longname] = outputFile.data;
              });
            }
          } catch (e) {
            setErrorPaths((prev) => [...prev, String(e)]);
            setStatus(STATUS.FILE_ERROR);
          }
        }
        // Update state incrementally if we want? Or just once at end is safer for now.
        // Let's do once at end for simplicity and correctness of data flow.
        // The progress bar for reading might jump to 100%, but it's safer.
      }),
    );

    setFileMap(localFileMap);

    // Now check if we can upload
    const readFilesCount = Object.keys(localFileMap).reduce((acc, el) => {
      const subTotal = Object.keys(localFileMap[el]).length; // simplified logic
      return acc + subTotal;
    }, 0);

    // Original helper logic for counting
    // "const toAdd = typeof fileMap[el][el2] === 'undefined' ? 0 : 1;"
    // It seems they handle sparse arrays? but here it's object.

    if (readFilesCount >= numFiles) {
      setStatus(STATUS.UPLOADING);
      if (overwriteMode) {
        await handleOverwrite();
      }

      // We need to pass localFileMap to upload to ensure it uses the latest
      // But `performUpload` uses `fileMap` from state/closure.
      // Since we are in the same scope, we can construct the uploader that uses localFileMap.

      // ... duplicate upload logic or make it accept fileMap arg?
      // Making `performUpload` accept `currentFileMap` is best.

      await performUploadWithMap(localFileMap);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    protoSubmissions,
    numFiles,
    overwriteMode,
    handleOverwrite,
    uploadSubmission,
    assignment,
    updateSubmission,
    deleteSubmission,
  ]);

  // Upload with explicit map
  const performUploadWithMap = async (currentFileMap: {
    [submitters: string]: { [fileName: string]: string | ArrayBuffer | null };
  }) => {
    const toUpload = overwriteMode
      ? [...protoSubmissions] // Shallow copy to allow mutation (pop)
      : protoSubmissions.filter((el) => !el.isCollision);

    const uploadAndPop = (submission: IProtoSubmission): Promise<void> => {
      const files: UploadFile[] = [];
      const submitter = submission.students.join(',');

      if (currentFileMap[submitter]) {
        Object.keys(currentFileMap[submitter]).forEach((fullname: string) => {
          const fileName = fullname.split('/').slice(-1)[0];
          const pathDirs = fullname.split('/');
          const filePath = pathDirs.length > 3 ? pathDirs.slice(2, pathDirs.length - 1).join('/') : null;
          const payload = {
            name: fileName,
            extension: fileName.includes('.') ? fileName.split('.').slice(-1)[0] : '',
            data: typeof currentFileMap[submitter][fullname] === 'string' ? currentFileMap[submitter][fullname] : '',
            path: filePath,
          };
          files.push(payload);
        });
      }

      return uploadSubmission(assignment, submission.students, files)
        .then(() => {
          setUploadMap((prev) => {
            const next = { ...prev };
            submission.students.forEach((student) => {
              next[student] = UPLOAD_STATUS.SUCCESS;
            });
            return next;
          });
          setNumUploaded((prev) => prev + 1);

          if (toUpload.length) {
            const newSub = toUpload.pop();
            if (newSub) {
              return uploadAndPop(newSub);
            }
          }
        })
        .catch(() => {
          setUploadMap((prev) => {
            const next = { ...prev };
            submission.students.forEach((student) => {
              next[student] = UPLOAD_STATUS.SUCCESS;
            });
            return next;
          });

          if (toUpload.length) {
            const newSub = toUpload.pop();
            if (newSub) {
              return uploadAndPop(newSub);
            }
          }
        });
    };

    const promises: Promise<void>[] = [];
    const MAX_NUM_CONNECTIONS = 5;
    const connectionsLimit = Math.min(toUpload.length, MAX_NUM_CONNECTIONS);

    for (let i = 0; i < connectionsLimit; i++) {
      const parentNode = toUpload.pop();
      if (parentNode) {
        promises.push(uploadAndPop(parentNode));
      }
    }

    await Promise.all(promises);
    setStatus(STATUS.COMPLETE);
  };

  const onStepToReading = useCallback(() => {
    performReadAndUpload();
  }, [performReadAndUpload]);

  const processSubmissions = useCallback(
    async (acceptedFiles: codePostFile[], getStudentsFromFile: (file: IProtoFileUpload) => string[]) => {
      await processSubmissionsFromFiles(
        acceptedFiles,
        students,
        studentMap,
        getStudentsFromFile,
        updateProtoSubmissions,
      );
      setStatus(STATUS.UPLOADED);
    },
    [students, studentMap, updateProtoSubmissions],
  );

  // Render logic...
  // Use status state to determine content
  // ...

  if (!isVisible) {
    return <div />;
  }

  // Title content
  const titleContent =
    mode && mode !== 'more' ? (
      <span>
        <img src={INTEGRATIONS[mode].logo} style={{ width: '25px', marginRight: 5, marginBottom: 3 }} alt="" />
        <span style={{ color: colors.brandPrimary }}>{mode.charAt(0).toUpperCase() + mode.slice(1)} import:</span>{' '}
        {assignment.name}
      </span>
    ) : (
      <span>Upload Submissions: {assignment.name}</span>
    );

  const stepsItems = [{ title: 'Upload' }, { title: 'Review' }, { title: 'Save' }];

  let stepNumber = 1;
  if (status === STATUS.NONE) stepNumber = 0;
  else if (status === STATUS.COMPLETE) stepNumber = 2;

  let content;
  let numToUpload = 0;

  if (status === STATUS.NONE) {
    if (students.length === 0) {
      content = course && <BulkUploadNoStudents course={course} />;
    } else {
      content = (
        <div>
          {!mode && (
            <div>
              <BulkUploadHeader
                showImportOptions={showImportOptions}
                toggleImportOptions={() => {
                  setShowImportOptions(true);
                }}
              />
              <Divider />
            </div>
          )}
          <UploadForm
            processSubmissionsFromFiles={processSubmissions}
            mode={mode}
            showImportOptions={showImportOptions}
            students={students}
            course={course}
            setIntegration={onIntegrationClick}
            onCancel={handleCancelClick}
            setImportOptions={handleUpdateImportOptions}
          />
        </div>
      );
    }
  } else if (status === STATUS.FILE_ERROR || status === STATUS.UPLOADED) {
    numToUpload = protoSubmissions.reduce((acc, sub) => {
      if (!sub.isCollision || (sub.isCollision && overwriteMode)) {
        return acc + 1;
      }
      return acc;
    }, 0);
    content = (
      <BulkUploadConfirm
        students={students}
        protoSubmissions={protoSubmissions}
        studentMap={studentMap}
        overwriteMode={overwriteMode}
        toggleOverwriteMode={toggleOverwriteMode}
        errorPaths={errorPaths}
      />
    );
  } else if (status === STATUS.READING) {
    // Since we read in one go without state updates in the loop, progress will change from 0 to 100 fast?
    // Actually I removed intermediate updates for fileMap.
    // So readFiles progress might just be 0 until done.
    // That's acceptable for robustness.
    const readFilesCount = Object.keys(fileMap).reduce((acc, el) => {
      const subTotal = Object.keys(fileMap[el]).length;
      return acc + subTotal;
    }, 0);

    content = (
      <div>
        Reading files: &nbsp;{' '}
        <Progress
          percent={numFiles > 0 ? parseFloat(((readFilesCount / numFiles) * 100).toFixed(0)) : 0}
          size="small"
        />
        Uploading submissions: &nbsp; <Progress percent={0} size="small" />
      </div>
    );
  } else if (status === STATUS.UPLOADING) {
    content = (
      <div>
        Reading files: &nbsp; <Progress percent={100} size="small" />
        Uploading submissions: &nbsp;
        <Progress
          percent={
            protoSubmissions.length > 0 ? parseFloat(((numUploaded / protoSubmissions.length) * 100).toFixed(0)) : 0
          }
          size="small"
        />
      </div>
    );
  } else if (status === STATUS.COMPLETE) {
    content = <BulkUploadComplete protoSubmissions={protoSubmissions} uploadMap={uploadMap} />;
  }

  let footer;
  if (status === STATUS.NONE) {
    footer = <div />;
  } else if (status === STATUS.UPLOADED) {
    footer = (
      <BulkUploadFooter
        backText="Start over"
        onBack={() => setStatus(STATUS.NONE)}
        forwardText="Upload"
        onForward={onStepToReading}
        disableForward={numToUpload === 0}
      />
    );
  } else if (status === STATUS.READING || status === STATUS.UPLOADING || status === STATUS.COMPLETE) {
    footer = (
      <BulkUploadFooter
        backText=""
        onBack={null}
        forwardText="Close"
        onForward={onCancel}
        disableForward={status !== STATUS.COMPLETE}
      />
    );
  }

  return (
    <Modal open={true} title={titleContent} width={900} onCancel={onCancel} footer={null} style={{ top: 20 }}>
      <Steps
        size="small"
        current={stepNumber}
        items={stepsItems.map((item) => ({ key: item.title, title: item.title }))}
      />
      <br />
      {content}
      {footer}
    </Modal>
  );
};

export default BulkUpload;
