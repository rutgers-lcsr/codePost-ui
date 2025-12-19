import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

import LangMap from 'lang-map';

// Base File type (without submission/assignment/course relationship)
const BaseFileV = t.intersection(
  [
    GenericObject,
    t.type({
      extension: t.string,
      name: t.string,
      path: t.union([t.string, t.null]),
      created: t.string,
    }),
    t.partial({
      data: t.string, // New field name
    }),
  ],
  'BaseFile',
);

// SubmissionFile type (files that belong to submissions)
const SubmissionFileV = t.intersection(
  [
    BaseFileV,
    t.type({
      submission: t.number,
      comments: t.array(t.number),
    }),
    t.partial({
      hiddenBeforePublish: t.boolean,
    }),
  ],
  'SubmissionFile',
);

const SubmissionFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      extension: t.string,
      name: t.string,
      submission: t.number,
      path: t.union([t.string, t.null]),
    }),
    t.partial({
      data: t.string,
      comments: t.array(t.number),
      hiddenBeforePublish: t.boolean,
    }),
  ],
  'SubmissionFilePost',
);

const SubmissionFileVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      data: t.string,
      comments: t.array(t.number),
      extension: t.string,
      name: t.string,
      submission: t.number,
      path: t.union([t.string, t.null]),
      hiddenBeforePublish: t.boolean,
    }),
  ],
  'SubmissionFilePatch',
);

// AssignmentFile type (files that belong to assignments)
const AssignmentFileV = t.intersection(
  [
    BaseFileV,
    t.type({
      assignment: t.number,
      description: t.string,
      required: t.boolean,
    }),
  ],
  'AssignmentFile',
);

const AssignmentFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      extension: t.string,
      name: t.string,
      assignment: t.number,
      path: t.union([t.string, t.null]),
    }),
    t.partial({
      data: t.string,
    }),
  ],
  'AssignmentFilePost',
);

// CourseFile type (files that belong to courses)
const CourseFileV = t.intersection(
  [
    BaseFileV,
    t.type({
      course: t.number,
    }),
  ],
  'CourseFile',
);

const CourseFileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      extension: t.string,
      name: t.string,
      course: t.number,
      path: t.union([t.string, t.null]),
    }),
    t.partial({
      data: t.string,
    }),
  ],
  'CourseFilePost',
);

// Legacy File type (for backwards compatibility - maps to SubmissionFile)
const FileV = SubmissionFileV;
const FileVPost = SubmissionFileVPost;
const FileVPatch = SubmissionFileVPatch;

// Export validators
export { AssignmentFileV, CourseFileV, SubmissionFileV };

export type FileType = t.TypeOf<typeof FileV>;
export type SubmissionFileType = t.TypeOf<typeof SubmissionFileV>;
export type AssignmentFileType = t.TypeOf<typeof AssignmentFileV>;
export type CourseFileType = t.TypeOf<typeof CourseFileV>;

export const MarkdownExtensions = ['md', '.md'];
export const JupyterExtensions = ['ipynb', '.ipynb'];
export const ImageExtensions = ['png', '.png', '.jpeg', 'jpeg', '.jpg', 'jpg', 'gif', '.gif'];
export const PDFExtensions = ['pdf', '.pdf'];
// https://github.com/bevry/binaryextensions/blob/master/source/index.json
export const BinaryExtensions = [
  'class',
  '.class',
  'jar',
  '.jar',
  'gar',
  '.gar',
  'dds',
  '.dds',
  'eot',
  '.eot',
  'ico',
  '.ico',
  'jar',
  '.jar',
  'swf',
  '.swf',
  'tga',
  '.tga',
  'ttf',
  '.ttf',
  'docx',
  '.docx',
  'exe',
  '.exe',
  'xlsx',
  '.xlsx',
];

type CodeType = 'code' | 'markdown' | 'jupyter' | 'image' | 'pdf';

// Helper to get file content (supports both 'data' and 'code' fields)
export const getFileContent = (file: FileType | SubmissionFileType | AssignmentFileType | CourseFileType): string => {
  // Prefer 'data' field, fall back to 'code' for backwards compatibility
  const fileWithContent = file as { data?: string };
  return fileWithContent.data || '';
};

export class File {
  public static create = createObject(FileV, FileVPost, 'files');
  public static read = readObject(FileV, 'files');
  public static update = updateObject(FileV, FileVPatch, 'files');
  public static delete = deleteObject(FileV, 'files');

  public static language = (file: FileType) => {
    const extensionMatch = /^(?:\.?)(.*)/;
    const extension = extensionMatch.exec(file.extension)![1];
    return LangMap.languages(extension)[0];
  };

  // FIXME: replace language with this
  public static language2 = (fileExtension: string) => {
    const extensionMatch = /^(?:\.?)(.*)/;
    const extension = extensionMatch.exec(fileExtension)![1];
    return LangMap.languages(extension)[0];
  };

  public static codeType = (file: FileType): CodeType => {
    return JupyterExtensions.includes(file.extension.toLowerCase())
      ? 'jupyter'
      : MarkdownExtensions.includes(file.extension.toLowerCase())
        ? 'markdown'
        : ImageExtensions.includes(file.extension.toLowerCase())
          ? 'image'
          : PDFExtensions.includes(file.extension.toLowerCase())
            ? 'pdf'
            : 'code';
  };

  public static extension = (filename: string): string => {
    return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
  };
}

// SubmissionFile class - for files belonging to submissions
export class SubmissionFile {
  public static create = createObject(SubmissionFileV, SubmissionFileVPost, 'submissionFiles');
  public static read = readObject(SubmissionFileV, 'submissionFiles');
  public static update = updateObject(SubmissionFileV, SubmissionFileVPatch, 'submissionFiles');
  public static delete = deleteObject(SubmissionFileV, 'submissionFiles');
}

// AssignmentFile class - for files belonging to assignments
export class AssignmentFile {
  public static create = createObject(AssignmentFileV, AssignmentFileVPost, 'assignmentFiles');
  public static read = readObject(AssignmentFileV, 'assignmentFiles');
  public static update = updateObject(AssignmentFileV, AssignmentFileVPost, 'assignmentFiles');
  public static delete = deleteObject(AssignmentFileV, 'assignmentFiles');
}

// CourseFile class - for files belonging to courses
export class CourseFile {
  public static create = createObject(CourseFileV, CourseFileVPost, 'courseFiles');
  public static read = readObject(CourseFileV, 'courseFiles');
  public static update = updateObject(CourseFileV, CourseFileVPost, 'courseFiles');
  public static delete = deleteObject(CourseFileV, 'courseFiles');
}

const codeString = `/******************************************************************
 *  Student: student@myschool.edu
 *  Section: Section 1
 *
 *  Partner: none
 *  Partner section: N/A
 *
 *  Description:  Prints 'Hello, World' to the terminal.
 *                By tradition, this is everyone's first program.
 *                Brian Kernighan initiated this tradition in 1974.
 *
 ***************************************************************/

public class HelloWorld {
    public static void main(String[] args) {
        System.out.print("Hello, World");

    }
}`;

export const FileMock: FileType = {
  id: 1,
  name: 'hello.java',
  extension: 'java',
  data: codeString,
  comments: [1],
  submission: 1,
  path: null,
  created: '',
};

// export { CodeType, FileType, File, FileMock };
