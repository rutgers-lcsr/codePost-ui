import * as t from 'io-ts';
import { createObject, deleteObject, GenericObject, readObject, updateObject } from './generics';

import LangMap from 'lang-map';

const FileV = t.intersection(
  [
    GenericObject,
    t.type({
      code: t.string,
      comments: t.array(t.number),
      extension: t.string,
      name: t.string,
      submission: t.number,
      path: t.union([t.string, t.null]),
      created: t.string,
    }),
    t.partial({}),
  ],
  'File',
);

const FileVPost = t.intersection(
  [
    GenericObject,
    t.type({
      code: t.string,
      comments: t.array(t.number),
      extension: t.string,
      name: t.string,
      submission: t.number,
      path: t.union([t.string, t.null]),
    }),
    t.partial({}),
  ],
  'FilePost',
);

const FileVPatch = t.intersection(
  [
    GenericObject,
    t.partial({
      code: t.string,
      comments: t.array(t.number),
      extension: t.string,
      name: t.string,
      submission: t.number,
      path: t.union([t.string, t.null]),
    }),
  ],
  'FilePatch',
);

export type FileType = t.TypeOf<typeof FileV>;

export const MarkdownExtensions = ['md', '.md'];
export const JupyterExtensions = ['ipynb', '.ipynb'];
export const ImageExtensions = ['png', '.png', '.jpeg', 'jpeg', '.jpg', 'jpg'];
export const PDFExtensions = ['pdf', '.pdf'];
export const BinaryExtensions = ['class', '.class', 'jar', '.jar', 'gar', '.gar'];

type CodeType = 'code' | 'markdown' | 'jupyter' | 'image' | 'pdf';

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
  code: codeString,
  comments: [1],
  submission: 1,
  path: null,
  created: '',
};

// export { CodeType, FileType, File, FileMock };
