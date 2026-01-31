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
    t.partial({
      hidden: t.boolean,
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
      hidden: t.boolean,
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


export interface NotebookCell {
  cell_type: 'code' | 'markdown' | 'raw';
  source: string[];
  metadata?: Record<string, unknown>;
  outputs?: unknown[];
  execution_count?: number | null;
}

export interface NotebookStructure {
  cells: NotebookCell[];
  metadata?: Record<string, unknown>;
  nbformat?: number;
  nbformat_minor?: number;
}

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

  public static language = (file: FileType | SubmissionFileType | AssignmentFileType | CourseFileType) => {
    // 1. Get unified extension
    const ext = File.extension(file.name);

    // 2. If it's a notebook, try to parse metadata
    if (ext === 'ipynb') {
      const content = getFileContent(file);
      if (content) {
        try {
          // Use JSON.parse for robust metadata extraction
          // We only care about the metadata field, which is usually at the top level
          const json = JSON.parse(content);

          if (json?.metadata?.language_info?.name) {
            return json.metadata.language_info.name.toLowerCase();
          }

          if (json?.metadata?.kernelspec?.language) {
            return json.metadata.kernelspec.language.toLowerCase();
          }
        } catch (e) {
          // If JSON parsing fails (e.g. invalid json or partial upload), fall back
          console.warn(`Failed to parse ipynb content for language detection: [${file.name}]`, e);
        }
      }
      return 'python'; // Default fallback for notebooks if parsing fails
    }

    // 3. Fallback to lang-map
    return LangMap.languages(ext)[0] || ext;
  };

  public static codeType = (file: FileType | SubmissionFileType | AssignmentFileType | CourseFileType): CodeType => {
    const ext = File.extension(file.name);
    return JupyterExtensions.includes(ext) || JupyterExtensions.includes('.' + ext)
      ? 'jupyter'
      : MarkdownExtensions.includes(ext) || MarkdownExtensions.includes('.' + ext)
        ? 'markdown'
        : ImageExtensions.includes(ext) || ImageExtensions.includes('.' + ext)
          ? 'image'
          : PDFExtensions.includes(ext) || PDFExtensions.includes('.' + ext)
            ? 'pdf'
            : 'code';
  };

  public static extension = (filename: string): string => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
  };

  public static parseNotebook = (content: string): NotebookStructure => {
    if (!content.trim()) {
      return File.getEmptyNotebook();
    }

    try {
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed.cells)) {
        throw new Error('Invalid notebook format: "cells" array is missing');
      }
      return parsed as NotebookStructure;
    } catch (e) {
      throw new Error(e instanceof Error ? e.message : 'Invalid JSON content');
    }
  };

  public static getEmptyNotebook = (): NotebookStructure => {
    return {
      cells: [],
      metadata: {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3',
        },
        language_info: {
          codemirror_mode: {
            name: 'ipython',
            version: 3,
          },
          file_extension: '.py',
          mimetype: 'text/x-python',
          name: 'python',
          nbconvert_exporter: 'python',
          pygments_lexer: 'ipython3',
          version: '3.8.5',
        },
      },
      nbformat: 4,
      nbformat_minor: 4,
    };
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
