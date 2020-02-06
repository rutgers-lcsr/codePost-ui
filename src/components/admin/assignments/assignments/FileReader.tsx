import JSZip from 'jszip';

import { message } from 'antd';

import { File as CodePostFile } from '../../../../infrastructure/file';

import { UploadFile } from 'antd/lib/upload/interface';

import { resizeImage } from '../../other/AdminUtils';

export interface IProtoFileUpload {
  longname: string;
  name: string;
  path: string;
  extension: string;
  data: string | ArrayBuffer | null;
  zipSource?: string;
}

export const fileToProtoFileUpload = (inputFile: File | UploadFile, zipSource?: string): IProtoFileUpload => {
  let longname: string = inputFile.name;

  // @ts-ignore
  if (inputFile.webkitRelativePath && inputFile.webkitRelativePath !== '') {
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
  const extension = CodePostFile.extension(inputFile.name);

  return {
    longname,
    name,
    path,
    extension,
    data: '', // placeholder
    zipSource,
  };
};

const FILE_SIZE_LIMIT_IN_BYTES = 3e6; // 3 megabytes

export const readUploadedFile = (inputFile: File, zipSource?: string): Promise<IProtoFileUpload[]> => {
  const reader = new FileReader();

  const size_bytes = inputFile.size;
  if (size_bytes > FILE_SIZE_LIMIT_IN_BYTES) {
    message.warning(
      `${inputFile.name} exceeds file size limit of ${FILE_SIZE_LIMIT_IN_BYTES /
        1e6} MB and cannot be uploaded (its size is ${(size_bytes / 1e6).toFixed(1)} MB).`,
      10,
    );
    return Promise.resolve([]);
  }

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
                  if (blob.size < FILE_SIZE_LIMIT_IN_BYTES) {
                    const unzippedFile = await readUploadedFile(new File([blob], zippedFile.name), outputFile.longname);
                    return unzippedFile;
                  } else {
                    message.warning(
                      `${zippedFile.name} exceeds file size limit of ${FILE_SIZE_LIMIT_IN_BYTES /
                        1e6} MB and cannot be uploaded (its size is ${(blob.size / 1e6).toFixed(1)} MB).`,
                      10,
                    );
                    return undefined;
                  }
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
