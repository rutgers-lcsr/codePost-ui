import { UploadFile } from 'antd/lib/upload/interface';

import { codePostFile, readZipTopLevel } from './FileReader';

export interface FolderToStudentMap {
  [folderName: string]: string | null;
}

export const getIdentifierFromFolder = (folderName: string, idIndex: number) => {
  const elems = folderName.split('_');
  return elems.length < idIndex + 1 ? elems[elems.length - 1] : elems[idIndex];
};

export const beforeLMSImport = (files: UploadFile[], callback: any) => {
  const addPathToFiles = (zipFile: File, unzippedFiles: File[]) => {
    return unzippedFiles.map((f: File) => {
      // We can't set the path of a file, so need to do a path override
      // @ts-ignore
      const cPFile: codePostFile = new File([f], f.name);
      cPFile['uid'] = '';
      // @ts-ignore
      cPFile['pathOverride'] = `${zipFile.webkitRelativePath}/${f.name}`;
      return cPFile;
    });
  };

  const beforeUpload = async (file: File, fileList: File[]) => {
    let newList: codePostFile[] = [];
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      const promises = fileList.map(async (thisFile) => {
        if (thisFile.name.endsWith('.zip')) {
          const unzippedFiles = await readZipTopLevel(thisFile);
          const filesWithPath = addPathToFiles(thisFile, unzippedFiles);
          newList.push(...filesWithPath);
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
