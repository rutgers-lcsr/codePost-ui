// class CodePostFileReader {
//   public firstName: string;
//   public lastName: string;
//   public constructor(firstName, lastName) {
//     this.firstName = firstName;
//     this.lastName = lastName;
//   }

//   public getName() {
//     return `${this.firstName} ${this.lastName}`;
//   }
// }

// const readFile = (file: File) => {
//   // output list of files
// }

// class CodePostFileUpload {
//   public name: string;
//   public extension: string;
//   public path: string;
//   public type: any;

// }

// export default CodePostFileReader;

import JSZip from 'jszip';

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

    reader.onload = () => {
      if (reader.result === null) {
        // FIXME
        // reject('Error uploading file: empty file');
        resolve([]);
      } else if (reader.result instanceof ArrayBuffer) {
        console.log('zip');
        const new_zip = new JSZip();
        // new_zip.loadAsync(reader.result).then((zip: any) => {
        //   zip.forEach((relativePath: any, f: any) => {
        //     if (relativePath.startsWith('__MACOSX')) {
        //       return;
        //     }

        //     if (!f.dir) {
        //       f.async('string').then(async (data: any) => {
        //         const split = relativePath.split('/');
        //         const filePath = split.slice(0, split.length - 1).join('/');
        //         const fileName = split[split.length - 1];

        //         let data: any = content;
        //         if (['png', 'jpeg', 'jpg'].includes(File.extension(fileName)) && typeof data === 'string') {
        //           data = await resizeImage(data);
        //         }

        //         this.updateFileState(fileName, filePath, data, file.name);
        //       });
        //     }
        //   });
        // });
      } else {
        let outputFile = fileToCodePostFileUpload(inputFile);
        outputFile = { ...outputFile, data: reader.result };

        resolve([outputFile]);
      }
    };

    if (inputFile.type.includes('image')) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type.includes('pdf')) {
      reader.readAsDataURL(inputFile);
    } else if (inputFile.type === 'application/zip') {
      reader.readAsArrayBuffer(inputFile);
    } else {
      reader.readAsText(inputFile);
    }
  });
};
