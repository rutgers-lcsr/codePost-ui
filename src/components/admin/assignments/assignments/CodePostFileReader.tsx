import JSZip from 'jszip';

import { File as CodePostFile } from '../../../../infrastructure/file';

import { resizeImage } from '../../other/AdminUtils';

interface ICodePostFileUpload {
  longname: string;
  name: string;
  path: string;
  data: string | ArrayBuffer | null;
  zipSource?: string;
}

const fileToCodePostFileUpload = (inputFile: File): ICodePostFileUpload => {
  let longname: string = inputFile.name;

  // @ts-ignore
  if (inputFile.webkitRelativePath && inputFile.webkitRelativePath !== '') {
    // @ts-ignore
    longname = inputFile.webkitRelativePath;
  }

  const split = longname.split('/');
  const path = split.slice(0, split.length - 1).join('/');
  const name = split[split.length - 1];

  return {
    longname,
    name,
    path,
    data: '', // placeholder
  };
};

export const readUploadedFile = (inputFile: File): Promise<ICodePostFileUpload[]> => {
  const reader = new FileReader();

  return new Promise((resolve, reject) => {
    reader.onerror = () => {
      reader.abort();
      // FIXME add message
      reject('Error uploading file.');
    };

    reader.onload = async () => {
      if (reader.result === null) {
        // FIXME
        // reject('Error uploading file: empty file');
        resolve([]);
      } else if (reader.result instanceof ArrayBuffer) {
        // Handle zip files
        const zipper = new JSZip();

        zipper
          .loadAsync(reader.result)
          .then((zip: any) => {
            // JSZip doesn't have a 'map' function over the files
            // which makes it difficult to do asynchronous work
            // Here we do two loops over the zip contents so that we can
            // use the Array.map functionality
            const listOfZippedFiles: any = [];
            zip.forEach((relativePath: any, zippedFile: any) => {
              listOfZippedFiles.push([relativePath, zippedFile]);
            });

            return listOfZippedFiles;
          })
          .then((listOfZippedFiles: any) => {
            const promises = listOfZippedFiles.map(async ([relativePath, zippedFile]: [any, any]) => {
              if (relativePath.startsWith('__MACOSX')) {
                return Promise.resolve();
              }

              if (!zippedFile.dir) {
                return zippedFile.async('blob').then(async (blob: Blob) => {
                  // Recursively read the new files, but we need to cast the
                  // Blob object into a File
                  const unzippedFile = await readUploadedFile(new File([blob], zippedFile.name));
                  return unzippedFile;
                });
              }
            });

            Promise.all(promises).then((dirtyUnzippedFiles: any) => {
              // dirtyUnzippedFiles includes ignored files (undefined) and nested unzips
              const unzippedFiles = dirtyUnzippedFiles
                .filter((f: any) => {
                  return f !== undefined;
                })
                .flat(Infinity);
              resolve(unzippedFiles);
            });
          });
      } else {
        let outputFile = fileToCodePostFileUpload(inputFile);
        let data: any = reader.result;

        if (['png', 'jpeg', 'jpg'].includes(CodePostFile.extension(inputFile.name)) && typeof data === 'string') {
          data = await resizeImage(data);
        }

        outputFile = { ...outputFile, data };

        resolve([outputFile]);
      }
    };

    if (inputFile.type.includes('image') || ['png', 'jpeg', 'jpg'].includes(CodePostFile.extension(inputFile.name))) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type.includes('pdf') || ['pdf'].includes(CodePostFile.extension(inputFile.name))) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type === 'application/zip' || ['zip'].includes(CodePostFile.extension(inputFile.name))) {
      reader.readAsArrayBuffer(inputFile);
    } else {
      reader.readAsText(inputFile);
    }
  });
};
