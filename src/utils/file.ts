// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import type { AssignmentFile, CourseFile, SubmissionFile } from '../api-client';
import { CommentType } from 'types/models';
import { fileTypeRegistry } from '../features/code-review/formats';
import { normalizedExtension, fileExtension } from './fileExtensions';

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

// Extension arrays derived from the file type registry. The registry definitions
// in `src/features/code-review/formats/definitions/` are the single source of truth;
// these re-exports exist for backward compatibility with existing consumers.
//
// IMPORTANT: These must be lazily evaluated because `file.ts` and `formats/index.ts`
// have a circular import relationship. At the time `file.ts` runs its top-level code,
// the file type definitions have not been registered yet. We use memoized getter functions
// that resolve on first access (which always happens after all modules are initialized).
function lazyExtensions(resolve: () => string[]): string[] {
  let cache: string[] | null = null;
  // Return a Proxy that behaves like a real array but defers evaluation.
  return new Proxy([] as string[], {
    get(_target, prop, receiver) {
      cache ??= resolve();
      return Reflect.get(cache, prop, receiver);
    },
    has(_target, prop) {
      cache ??= resolve();
      return Reflect.has(cache, prop);
    },
    ownKeys() {
      cache ??= resolve();
      return Reflect.ownKeys(cache);
    },
    getOwnPropertyDescriptor(_target, prop) {
      cache ??= resolve();
      return Object.getOwnPropertyDescriptor(cache, prop);
    },
  });
}

export const MarkdownExtensions = lazyExtensions(() => fileTypeRegistry.getExtensionsWithDots('markdown'));
export const JupyterExtensions = lazyExtensions(() => fileTypeRegistry.getExtensionsWithDots('jupyter'));
export const ImageExtensions = lazyExtensions(() => fileTypeRegistry.getExtensionsWithDots('image'));
export const PDFExtensions = lazyExtensions(() => fileTypeRegistry.getExtensionsWithDots('pdf'));
export const BinaryExtensions = lazyExtensions(() => fileTypeRegistry.getExtensionsByCapability((cap) => cap.binary));
export const ExecutableExtensions = lazyExtensions(() => fileTypeRegistry.getExecutableExtensions());

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
  public static normalizedExtension = (
    fileOrName: Pick<FileLike, 'name' | 'extension'> | string | null | undefined,
  ): string => {
    return normalizedExtension(fileOrName);
  };

  public static isNotebookFile = (
    fileOrName: Pick<FileLike, 'name' | 'extension'> | string | null | undefined,
  ): boolean => {
    const ext = File.normalizedExtension(fileOrName);
    return fileTypeRegistry.detectByExtension(ext).id === 'jupyter';
  };

  public static language = (file: FileType) => {
    return fileTypeRegistry.resolveLanguage(file);
  };

  public static isExecutable = (
    fileOrName: Pick<FileLike, 'name' | 'extension'> | string | null | undefined,
  ): boolean => {
    const ext = File.normalizedExtension(fileOrName);
    return fileTypeRegistry.isExecutableExtension(ext);
  };

  public static codeType = (file: FileType): CodeType => {
    return fileTypeRegistry.detect(file).id as CodeType;
  };

  public static extension = (filename: string): string => {
    return fileExtension(filename);
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
