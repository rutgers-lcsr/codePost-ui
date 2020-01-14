import JSZip from 'jszip';

import { File as CPFile } from '../../../../infrastructure/file';

import { UploadFile } from 'antd/lib/upload/interface';

import { resizeImage } from '../../other/AdminUtils';

export interface IProtoFileUpload {
  longname: string;
  name: string;
  path: string;
  extension: string;
  data: string | ArrayBuffer | null;
  zipSource?: string;
  file: File | UploadFile;
}

export interface codePostFile extends UploadFile {
  pathOverride?: string;
}

export const fileToProtoFileUpload = (
  inputFile: codePostFile | File | UploadFile,
  zipSource?: string,
): IProtoFileUpload => {
  let longname: string = inputFile.name;

  console.log(inputFile);

  // @ts-ignore
  if (inputFile.pathOverride) {
    // @ts-ignore
    longname = inputFile.pathOverride;
    // @ts-ignore
  } else if (inputFile.webkitRelativePath && inputFile.webkitRelativePath !== '') {
    // @ts-ignore
    longname = inputFile.webkitRelativePath;
  }

  const split = longname.split('/');
  const path = split
    .slice(0, split.length - 1)
    .join('/')
    .trim()
    .toLowerCase();
  const name = split[split.length - 1];
  const extension = CPFile.extension(name);

  return {
    longname,
    name,
    path,
    extension,
    data: '', // placeholder
    zipSource,
    file: inputFile,
  };
};

export const readUploadedFile = (inputFile: File, zipSource?: string): Promise<IProtoFileUpload[]> => {
  const reader = new FileReader();

  let outputFile = fileToProtoFileUpload(inputFile, zipSource);

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject('Error uploading file.');
    };

    reader.onload = async () => {
      let readerResult = reader.result;
      if (reader.result === null || reader.result === '') {
        readerResult = '-';
      }

      if (reader.result instanceof ArrayBuffer) {
        // Handle zip files
        const zipper = new JSZip();

        zipper
          .loadAsync(reader.result)
          .then((zip: any) => {
            // JSZip doesn't have a 'map' function over the files
            // which makes it difficult to do asynchronous work
            // Here we do two loops over the zip contents so that we can
            // use the Array.map functionality
            const listOfZippedFiles: [string, any][] = [];
            zip.forEach((relativePath: string, zippedFile: any) => {
              listOfZippedFiles.push([relativePath, zippedFile]);
            });

            return listOfZippedFiles;
          })
          .then((listOfZippedFiles: [string, any][]) => {
            const promises = listOfZippedFiles.map(async ([relativePath, zippedFile]: [string, any]) => {
              if (relativePath.startsWith('__MACOSX')) {
                return Promise.resolve();
              }

              if (!zippedFile.dir) {
                return zippedFile.async('blob').then(async (blob: Blob) => {
                  // Recursively read the new files, but we need to cast the
                  // Blob object into a File
                  const unzippedFile = await readUploadedFile(new File([blob], zippedFile.name), outputFile.longname);
                  return unzippedFile;
                });
              }
            });

            Promise.all(promises).then((dirtyUnzippedFiles: any) => {
              // dirtyUnzippedFiles includes ignored files (undefined) and nested unzips
              const unzippedFiles = dirtyUnzippedFiles
                .filter((f: IProtoFileUpload | undefined) => {
                  return f !== undefined;
                })
                .flat(Infinity);
              resolve(unzippedFiles);
            });
          });
      } else {
        let data: any = readerResult;

        if (['png', 'jpeg', 'jpg'].includes(outputFile.extension) && typeof data === 'string') {
          data = await resizeImage(data);
        }

        if (typeof data === 'string') {
          data = data.replace(/\0/g, '');
        }

        outputFile = { ...outputFile, data };
        resolve([outputFile]);
      }
    };

    if (inputFile.type.includes('image') || ['png', 'jpeg', 'jpg'].includes(outputFile.extension)) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type.includes('pdf') || ['pdf'].includes(outputFile.extension)) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type === 'application/zip' || ['zip'].includes(outputFile.extension)) {
      reader.readAsArrayBuffer(inputFile);
    } else {
      reader.readAsText(inputFile);
    }
  });
};

// This is mostly the same code as the function above, but with a different return type
// I made a valiant effort to get the Typescript function overloading working, but to not avail
// The only functional difference here is that it doesn't recursively call itself
export const readZipTopLevel = (inputFile: File): Promise<File[]> => {
  const reader = new FileReader();
  let protoFileUpload = fileToProtoFileUpload(inputFile);

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      reject('Error uploading file.');
    };

    reader.onload = async () => {
      if (reader.result === null || reader.result === '') {
        reject(`${protoFileUpload.longname} cannot be uploaded because it is empty.`);
      } else {
        const zipper = new JSZip();

        zipper
          .loadAsync(reader.result)
          .then((zip: any) => {
            // JSZip doesn't have a 'map' function over the files
            // which makes it difficult to do asynchronous work
            // Here we do two loops over the zip contents so that we can
            // use the Array.map functionality
            const listOfZippedFiles: [string, any][] = [];
            zip.forEach((relativePath: string, zippedFile: any) => {
              listOfZippedFiles.push([relativePath, zippedFile]);
            });

            return listOfZippedFiles;
          })
          .then((listOfZippedFiles: [string, any][]) => {
            const promises = listOfZippedFiles.map(async ([relativePath, zippedFile]: [string, any]) => {
              if (relativePath.startsWith('__MACOSX')) {
                return Promise.resolve();
              }

              if (!zippedFile.dir) {
                return zippedFile.async('blob').then((blob: Blob) => {
                  return new File([blob], zippedFile.name);
                });
              }
            });

            Promise.all(promises).then((dirtyUnzippedFiles: any) => {
              // dirtyUnzippedFiles includes ignored files (undefined) and nested unzips
              const unzippedFiles = dirtyUnzippedFiles
                .filter((f: IProtoFileUpload | undefined) => {
                  return f !== undefined;
                })
                .flat(Infinity);
              resolve(unzippedFiles);
            });
          });
      }
    };

    if (inputFile.type === 'application/zip' || ['zip'].includes(protoFileUpload.extension)) {
      reader.readAsArrayBuffer(inputFile);
    } else {
      reject('Not a zip');
    }
  });
};
