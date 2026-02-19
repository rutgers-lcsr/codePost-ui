import LangMap from 'lang-map';
import type { AssignmentFile, CourseFile, SubmissionFile } from '../api-client';
import { CommentType } from 'types/models';

type FileMetadata = {
  id?: number;
  submission?: number;
  comments?: Array<CommentType | number>;
  created?: string;
};

export type FileType = (AssignmentFile | CourseFile | SubmissionFile | FileLike) & FileMetadata;
export type FileWithId = FileType & { id: number; comments?: Array<CommentType | number>; created?: string };
export type AssignmentFileType = AssignmentFile;
export type CourseFileType = CourseFile;
export type SubmissionFileType = SubmissionFile;

export interface FileLike {
  id?: number;
  name: string;
  extension: string;
  path?: string | null;
  data?: string | null;
  submission?: number;
  comments?: Array<CommentType | number>;
  created?: string;
}

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

export const getFileContent = (file: FileType): string => {
  const fileWithContent = file as { data?: string | null };
  return fileWithContent.data || '';
};

export class File {
  public static language = (file: FileType) => {
    const ext = File.extension(file.name);

    if (ext === 'ipynb') {
      const content = getFileContent(file);
      if (content) {
        try {
          const json = JSON.parse(content);

          if (json?.metadata?.language_info?.name) {
            return String(json.metadata.language_info.name).toLowerCase();
          }

          if (json?.metadata?.kernelspec?.language) {
            return String(json.metadata.kernelspec.language).toLowerCase();
          }
        } catch (e) {
          console.warn(`Failed to parse ipynb content for language detection: [${file.name}]`, e);
        }
      }
      return 'python';
    }

    return LangMap.languages(ext)[0] || ext;
  };

  public static codeType = (file: FileType): CodeType => {
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

    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed.cells)) {
      throw new Error('Invalid notebook format: "cells" array is missing');
    }
    return parsed as NotebookStructure;
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
  public static extractNotebookCode = (content: string): string => {
    try {
      const notebook = File.parseNotebook(content);
      return notebook.cells
        .filter((c) => c.cell_type === 'code')
        .map((c) => (Array.isArray(c.source) ? c.source.join('') : c.source))
        .join('\n');
    } catch (e) {
      console.warn('Failed to extract code from notebook:', e);
      return '';
    }
  };
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

export const FileMock: FileLike = {
  id: 0,
  name: 'hello.java',
  extension: 'java',
  data: codeString,
  path: null,
};
