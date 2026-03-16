// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { IProtoSubmission, codePostFile, IProtoFileUpload, fileToProtoFileUpload } from './../FileReader';

//**************************************** Public Enums  **********************************

/* note that the order here defines the order in which students are rendered  (ERROR first, UPLOADED last) */
export enum STUDENT_STATUS {
  EXISTING /* student has an existing submission for this assignment */,
  MISSING /* no submission for this student, saved or unsaved */,
}

/* note that the order here defines the order in which students are rendered  (ERROR first, UPLOADED last) */
export enum UPLOAD_STATUS {
  SUCCESS,
  ERROR,
}

//********************************** Public Helper functions  ******************************
export const getSubforStudent = (student: string, protoSubmissions: IProtoSubmission[]) => {
  for (const sub of protoSubmissions) {
    if (
      sub.students.some((el) => {
        return isEqual(el, student);
      })
    ) {
      return sub;
    }
  }

  return undefined;
};

export const isEqual = (string1: string, string2: string) => {
  // Case insensitive string compare
  return string1.toLowerCase() === string2.toLowerCase();
};

//********************************** Validate files and turn to submissions  ******************************

export const processSubmissionsFromFiles = async (
  acceptedFiles: codePostFile[],
  students: string[],
  uploadStatusByStudent: { [student: string]: STUDENT_STATUS },
  getStudentsFromFile: (file: IProtoFileUpload) => string[],
  setProtoSubmissions: (protoSubmissions: IProtoSubmission[], numFiles: number, errors: string[]) => void,
) => {
  // Make sure the files have valid students
  const [folderMap, errors] = validateStudents(students, uploadStatusByStudent, acceptedFiles, getStudentsFromFile);

  const invalidPaths: string[] = errors;

  // Sort files into appropriate protoSubmissions
  let numFiles = 0;
  acceptedFiles.forEach((file: codePostFile) => {
    // const folderName = file.path.split('/')[1];
    const protoFile = fileToProtoFileUpload(file);

    const fileErrors = validateFile(protoFile);
    if (fileErrors.length > 0) {
      invalidPaths.concat(fileErrors);
    } else {
      const students = getStudentsFromFile(protoFile);
      const folderName = students.toString();
      if (folderName in folderMap) {
        folderMap[folderName].files.push(file);
        numFiles = numFiles + 1;
      }
    }
  });

  // Remove protoSubmissions which have no files (because all of the files are invalid)
  Object.keys(folderMap).forEach((key) => {
    if (folderMap[key].files.length === 0) {
      delete folderMap[key];
    }
  });

  const protoSubmissions: IProtoSubmission[] = Object.keys(folderMap).map((key) => {
    return folderMap[key];
  });

  setProtoSubmissions(protoSubmissions, numFiles, errors);
};

//*********************************************************************************************
//****************************** Internal validation helper functions *************************
//*********************************************************************************************

//********************************** Student validation ******************************
const isValidStudent = (student: string, students: string[]) => {
  return students.some((el) => {
    return isEqual(el, student);
  });
};

const allStudentsValid = (candidates: string[], students: string[]) => {
  for (const candidate of candidates) {
    if (!isValidStudent(candidate, students)) {
      return false;
    }
  }

  return true;
};

const noDuplicates = (candidates: string[]) => {
  const seenCandidates: Record<string, boolean> = {};
  for (const candidate of candidates) {
    if (seenCandidates[candidate]) {
      return false;
    } else {
      seenCandidates[candidate] = true;
    }
  }

  return true;
};

// Returns true if any of the provided students already have a submission
// Else returns false
const hasExistingSubmission = (emails: string[], studentMap: { [student: string]: STUDENT_STATUS }) => {
  for (const email of emails) {
    if (studentMap[email] === STUDENT_STATUS.EXISTING) {
      return true;
    }
  }
  return false;
};

const validateStudents = (
  students: string[],
  studentMap: { [student: string]: STUDENT_STATUS },
  files: codePostFile[],
  getStudentsFromFile: (file: IProtoFileUpload) => string[],
): [Record<string, { files: codePostFile[]; students: string[]; isCollision: boolean }>, string[]] => {
  const alreadySeen: { [student: string]: boolean } = {};
  const folderMap: Record<string, { files: codePostFile[]; students: string[]; isCollision: boolean }> = {};
  const errors: string[] = [];

  files.forEach((newFile: codePostFile) => {
    const protoFileUpload = fileToProtoFileUpload(newFile);
    const emails = getStudentsFromFile(protoFileUpload);
    const folderName = emails.toString();

    if (!allStudentsValid(emails, students)) {
      errors.push(`Folder refers to invalid student: ${folderName}`);
    } else if (!noDuplicates(emails)) {
      errors.push(`Folder contains duplicate students: ${folderName}`);
    } else {
      // No need to check folders which we've already validated
      if (!(folderName in folderMap)) {
        // Only use valid emails
        const validEmails = emails.filter((el) => {
          // Email must be valid and so far unsued
          return !alreadySeen[el];
        });

        if (validEmails.length !== emails.length) {
          // Some email in the folder name was invalid
          errors.push(`Contains a duplicate student: ${protoFileUpload.longname}`);
        } else {
          const hasCollision = hasExistingSubmission(emails, studentMap);

          folderMap[folderName] = {
            files: [],
            students: validEmails,
            isCollision: hasCollision,
          };

          validEmails.forEach((el) => {
            alreadySeen[el] = true;
          });
        }
      }
    }
  });

  return [folderMap, errors];
};

//********************************** Files validation ******************************
const validateFile = (file: IProtoFileUpload) => {
  const errors: string[] = [];
  // Check if any of the folders start with .
  const hasSystemFolders = file.longname.split('/').find((pathEl: string) => {
    return pathEl.startsWith('.');
  });

  if (hasSystemFolders) {
    errors.push(`Cannot have a folder that starts with .: ${file.longname}`);
  }

  return errors;
};
