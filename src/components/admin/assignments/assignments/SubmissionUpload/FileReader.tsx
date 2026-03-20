// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import JSZip from 'jszip';

import { message } from 'antd';

import { BinaryExtensions, File as CPFile, ImageExtensions, PDFExtensions } from '../../../../../utils/file';

import { UploadFile } from 'antd/lib/upload/interface';

import { resizeImage } from '../../../other/AdminUtils';

export interface IBaseFileUpload {
  name: string;
  data: string | ArrayBuffer | null;
}

export interface IProtoFileUpload extends IBaseFileUpload {
  longname: string;
  path: string;
  extension: string;
  zipSource?: string;
  file: File | UploadFile | Blob;
}

export interface IProtoSubmission {
  students: string[];
  files: Array<File | codePostFile>;
  isCollision: boolean /* true if any student has an existing submission */;
}

const isProtoFileUploadArray = (value: unknown): value is IProtoFileUpload[] => {
  return Array.isArray(value);
};

const isFile = (value: unknown): value is File => {
  return value instanceof File;
};

export interface codePostFile extends UploadFile {
  // Field to set the path of a file
  // webkitRelativePath is not settable
  pathOverride?: string;
}

export const fileToProtoFileUpload = (
  inputFile: codePostFile | File | UploadFile | Blob,
  zipSource?: string,
): IProtoFileUpload => {
  // @ts-expect-error: legacy-ts-ignore
  let longname: string = inputFile.name;

  // @ts-expect-error: legacy-ts-ignore
  if (inputFile.pathOverride) {
    // @ts-expect-error: legacy-ts-ignore
    longname = inputFile.pathOverride;
    // @ts-expect-error: legacy-ts-ignore
  } else if (inputFile.webkitRelativePath && inputFile.webkitRelativePath !== '') {
    // @ts-expect-error: legacy-ts-ignore
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

const FILE_SIZE_LIMIT_IN_BYTES = 10e6; // 10 megabytes

export const readUploadedFile = (inputFile: File | Blob, zipSource?: string): Promise<IProtoFileUpload[]> => {
  const reader = new FileReader();

  const size_bytes = inputFile.size;
  if (size_bytes > FILE_SIZE_LIMIT_IN_BYTES) {
    message.warning(
      // @ts-expect-error: legacy-ts-ignore
      `${inputFile.name} exceeds file size limit of ${
        FILE_SIZE_LIMIT_IN_BYTES / 1e6
      } MB and cannot be uploaded (its size is ${(size_bytes / 1e6).toFixed(
        1,
      )} MB). Please try using a compression tool for your file and re-uploading.\nIf you need help, please contact us at team@codepost.io.`,
      15,
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
          .then((zip: JSZip) => {
            // JSZip doesn't have a 'map' function over the files
            // which makes it difficult to do asynchronous work
            // Here we do two loops over the zip contents so that we can
            // use the Array.map functionality
            const listOfZippedFiles: [string, JSZip.JSZipObject][] = [];
            zip.forEach((relativePath: string, zippedFile: JSZip.JSZipObject) => {
              listOfZippedFiles.push([relativePath, zippedFile]);
            });

            return listOfZippedFiles;
          })
          .then((listOfZippedFiles: [string, JSZip.JSZipObject][]) => {
            const promises = listOfZippedFiles.map(async ([relativePath, zippedFile]: [string, JSZip.JSZipObject]) => {
              if (relativePath.startsWith('__MACOSX')) {
                return Promise.resolve();
              }

              if (!zippedFile.dir) {
                return zippedFile.async('blob').then(async (blob: Blob) => {
                  // Recursively read the new files, but we need to cast the
                  // Blob object into a File
                  if (blob.size < FILE_SIZE_LIMIT_IN_BYTES) {
                    // @ts-expect-error: legacy-ts-ignore
                    blob.name = zippedFile.name;
                    const unzippedFile = await readUploadedFile(blob, outputFile.longname);
                    return unzippedFile;
                  } else {
                    message.warning(
                      `${zippedFile.name} exceeds file size limit of ${
                        FILE_SIZE_LIMIT_IN_BYTES / 1e6
                      } MB and cannot be uploaded (its size is ${(blob.size / 1e6).toFixed(1)} MB).
                        The rest of the zip contents will attempt to be uploaded (see details below).`,
                      10,
                    );
                    return undefined;
                  }
                });
              }
            });

            Promise.all(promises).then((dirtyUnzippedFiles) => {
              // dirtyUnzippedFiles includes ignored files (undefined) and nested unzips
              const unzippedFiles = dirtyUnzippedFiles.filter(isProtoFileUploadArray).flat();
              resolve(unzippedFiles);
            });
          });
      } else {
        let data: string | ArrayBuffer = readerResult ?? '-';

        if (outputFile.extension === '') {
          if (typeof data === 'string') {
            // eslint-disable-next-line no-control-regex
            const match = data.match(/\0/g);
            // If a no-extension file has null characters then it might be an executable
            // Avoid corrupting it by saving as base64
            if (match !== null) {
              reader.readAsDataURL(inputFile);
              return;
            }
          }
        } else {
          if (typeof data === 'string') {
            // eslint-disable-next-line no-control-regex
            const match = data.match(/\0/g);
            // If a file contains a null character and is not on the Binary Whitelist, notify the team and then strip it
            if (match !== null) {
              // sendSlack('Replaced Null Character', `${outputFile.name}`, '#fafafa', 'user_notifications_uploads');
              // eslint-disable-next-line no-control-regex
              data = data.replace(/\0/g, '');
            }
          }
        }

        if (ImageExtensions.includes(outputFile.extension.toLowerCase()) && typeof data === 'string') {
          data = await resizeImage(data);
        }

        outputFile = { ...outputFile, data };
        resolve([outputFile]);
      }
    };

    if (
      inputFile.type.includes('image') ||
      ImageExtensions.includes(outputFile.extension.toLowerCase()) ||
      BinaryExtensions.includes(outputFile.extension.toLowerCase())
    ) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type.includes('pdf') || PDFExtensions.includes(outputFile.extension)) {
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
  const protoFileUpload = fileToProtoFileUpload(inputFile);

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
          .then((zip: JSZip) => {
            // JSZip doesn't have a 'map' function over the files
            // which makes it difficult to do asynchronous work
            // Here we do two loops over the zip contents so that we can
            // use the Array.map functionality
            const listOfZippedFiles: [string, JSZip.JSZipObject][] = [];
            zip.forEach((relativePath: string, zippedFile: JSZip.JSZipObject) => {
              listOfZippedFiles.push([relativePath, zippedFile]);
            });

            return listOfZippedFiles;
          })
          .then((listOfZippedFiles: [string, JSZip.JSZipObject][]) => {
            const promises = listOfZippedFiles.map(async ([relativePath, zippedFile]: [string, JSZip.JSZipObject]) => {
              if (relativePath.startsWith('__MACOSX')) {
                return Promise.resolve();
              }

              if (!zippedFile.dir) {
                return zippedFile.async('blob').then((blob: Blob) => {
                  // @ts-expect-error: legacy-ts-ignore
                  blob.name = zippedFile.name;
                  return blob;
                });
              }
            });

            Promise.all(promises).then((dirtyUnzippedFiles) => {
              // dirtyUnzippedFiles includes ignored files (undefined) and nested unzips
              const unzippedFiles = dirtyUnzippedFiles.filter(isFile);
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
