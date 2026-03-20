// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { UploadFile } from 'antd/lib/upload/interface';

import { codePostFile, readZipTopLevel } from './../FileReader';

export interface FolderToStudentMap {
  [folderName: string]: string | null;
}

export const getZipExample = (delimiter: string) => {
  return `\`\`\`
  folder/
    etc${delimiter}student1${delimiter}etc.zip
    etc${delimiter}student2${delimiter}etc.zip
  \`\`\``;
};

export const getFileExample = (delimiter: string) => {
  return `\`\`\`
folder/
  etc${delimiter}student1${delimiter}file1.ext
  etc${delimiter}student1${delimiter}file2.ext
  etc${delimiter}student2${delimiter}file1.ext
  etc${delimiter}student2${delimiter}file2.ext
\`\`\``;
};

export const getIdentifierFromFolder = (folderName: string, idIndex: number) => {
  const elems = folderName.split('_');
  return elems.length < idIndex + 1 ? elems[elems.length - 1] : elems[idIndex];
};

// This before upload function is customized for two reasons:
//     1. The file path is required to know which submission a file is a part of
//        and there's no way to set it manually, so we set it in a pathOverride field.
//        This is unique to folders of zip files.
//     2. Our normal upload is an n^2 operation, all files are added on every upload.
//        This is too slow for a typical 400-500 person course, so changing it to an O(n) operation.
//     3. Drag to upload doesn't seem to work for a directory of zips, so mandating users have to click to upload
export const beforeLMSImport = (
  files: UploadFile[],
  acceptZipsOnly: boolean,
  callback: (files: codePostFile[]) => void,
) => {
  const copyFile = (f: File, parentPath: string) => {
    // We can't set the path of a file, so need to do a path override
    const cPFile: codePostFile = new File([f], f.name) as any;
    cPFile['uid'] = '';
    cPFile['pathOverride'] = `${parentPath}/${f.name}`;
    return cPFile;
  };

  const addPathToFiles = (zipFile: File, unzippedFiles: File[]) => {
    return unzippedFiles.map((f: File) => copyFile(f, zipFile.webkitRelativePath));
  };

  const beforeUpload = async (file: File, fileList: File[]) => {
    const newList: codePostFile[] = [];
    // Only run it for the first file, but run across all files in the fileList
    if (fileList.length > 1 && file === fileList[0]) {
      const promises = fileList.map(async (thisFile) => {
        if (thisFile.name.endsWith('.zip')) {
          const unzippedFiles = await readZipTopLevel(thisFile);
          const filesWithPath = addPathToFiles(thisFile, unzippedFiles);
          newList.push(...filesWithPath);
        } else if (!acceptZipsOnly) {
          const cPFile: codePostFile = copyFile(thisFile, thisFile.webkitRelativePath);
          newList.push(cPFile);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      callback([...files, ...newList]);
    }

    // prevent upload
    return Promise.reject();
  };

  return beforeUpload;
};
