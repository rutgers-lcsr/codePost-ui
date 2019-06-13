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
    }),
    t.partial({}),
  ],
  'File',
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
    }),
  ],
  'FilePatch',
);

type FileType = t.TypeOf<typeof FileV>;

const MarkdownExtensions = ['ipynb', '.ipynb', 'md', '.md'];
const JupyterExtensions = ['ipynb', '.ipynb'];

class File {
  public static create = createObject(FileV, FileV, 'files');
  public static read = readObject(FileV, 'files');
  public static update = updateObject(FileV, FileVPatch, 'files');
  public static delete = deleteObject(FileV, 'files');

  public static language = (file: FileType) => {
    const extensionMatch = /^(?:\.?)(.*)/;
    const extension = extensionMatch.exec(file.extension)![1];
    return LangMap.languages(extension)[0];
  };

  public static isMarkdown = (file: FileType) => {
    return MarkdownExtensions.includes(file.extension);
  };

  public static isJupyter = (file: FileType) => {
    return JupyterExtensions.includes(file.extension);
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

const FileMock: FileType = {
  id: 1,
  name: 'hello.java',
  extension: 'java',
  code: codeString,
  comments: [1],
  submission: 1,
};

export { FileType, File, FileMock };
