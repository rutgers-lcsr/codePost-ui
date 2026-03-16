// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/***********************************************************************************
/* Description: This is an upload component for a folder of folders, where each child folder
/*              contains all the files of a student's code
/***********************************************************************************/

import * as React from 'react';

import { InboxOutlined } from '@ant-design/icons';

/* ant imports */
import { Collapse, Statistic, Switch, Upload } from 'antd';

import ReactMarkdown from 'react-markdown';

import BlockMarkdown from '../../../../../core/BlockMarkdown';

import { BulkUploadFooter } from './BulkUploadComponents';

import { UploadFile } from 'antd/lib/upload/interface';

import { codePostFile, fileToProtoFileUpload, IProtoFileUpload } from './../FileReader';

const Dragger = Upload.Dragger;

interface IFolderImportProps {
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  onCancel: () => void;
  instructions: React.ReactNode;
}

/******************************* Folder import helpers ***********************************/

const beforeUploadDirectory = (files: UploadFile[], callback: (files: UploadFile[]) => void) => {
  const beforeUpload = async (file: UploadFile, fileList: UploadFile[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      callback(
        fileList.filter((el) => {
          const protoFileUpload: IProtoFileUpload = fileToProtoFileUpload(el);
          return protoFileUpload.path.split('/').length > 1 && el.name !== '.DS_Store'; // filter our system files
        }),
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      const protoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);
      if (protoFileUpload.path.split('/').length > 1 && file.name !== '.DS_Store') {
        // ignore system files
        const newList = [...files, file];
        callback(newList);
      }
    }

    // prevent upload
    return Promise.reject();
  };

  return beforeUpload;
};

// Currently unused Zip upload logic
// const beforeUploadZip = (files: UploadFile[], callback: any) => {
//   const beforeUpload = async (file: File, fileList: File[]) => {
//     const unzippedFiles = await readZipTopLevel(file);
//
//     const filteredFiles = unzippedFiles.filter((file: File) => {
//       const protoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);
//       return protoFileUpload.path.split('/').length > 1;
//     });
//
//     callback(filteredFiles);
//
//     // prevent upload
//     return Promise.reject();
//   };
//   return beforeUpload;
// };

/******************************* Folder import core component ***********************************/

export const FolderImport = (props: IFolderImportProps) => {
  const [zipMode, setZipMode] = React.useState(false);
  const [rawFiles, setRawFiles] = React.useState<codePostFile[]>([]);

  const beforeUpload = beforeUploadDirectory(rawFiles, setRawFiles);

  const onChange = (checked: boolean) => {
    setZipMode(checked);
  };

  const getStudentsFromFile = (file: IProtoFileUpload) => {
    const folderName = file.path.split('/')[1];
    return folderName.split(',');
  };

  const onUpload = () => {
    props.processSubmissionsFromFiles(rawFiles, getStudentsFromFile);
  };

  return (
    <div>
      <Collapse
        items={[
          {
            key: '1',
            label: 'Instructions',
            children: props.instructions,
          },
        ]}
      />
      <br />
      <br />
      <Switch checked={zipMode} onChange={onChange} /> <span> Upload Zip File</span>
      <br />
      <br />
      <Dragger showUploadList={false} directory={true} multiple={false} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">Make sure you use the format specified in the Instructions above.</p>
      </Dragger>
      <br />
      {zipMode ? (
        <Statistic title="Unzipped and uploaded files" value={rawFiles.length} />
      ) : (
        <Statistic title="Uploaded files" value={rawFiles.length} />
      )}
      <BulkUploadFooter
        backText="Cancel"
        onBack={props.onCancel}
        forwardText="Upload"
        onForward={onUpload}
        disableForward={rawFiles.length === 0}
      />
    </div>
  );
};

/******************** Wrapped integration-speicfic components *******************************/

interface IUploadFormProps {
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  onCancel: () => void;
}

export const NormalFolderImport = (props: IUploadFormProps) => {
  const exampleText = `\`\`\`
  folder/
    student1@university.edu/
      file1.java
      file2.txt
    student2@university.edu,student3@university.edu/
      file1.java
      file2.txt
  \`\`\``;

  const instructions = (
    <div>
      {' '}
      Upload a folder with the following file structure.
      <br />
      <br />
      <ReactMarkdown>{exampleText}</ReactMarkdown>
    </div>
  );

  return <FolderImport {...props} instructions={instructions} />;
};

export const GithubFolderImport = (props: IUploadFormProps) => {
  const instructionText = `
See [GitHub](https://github.com/codepost-io/integration-github) for more details.

Choose the instructions that best apply to your GitHub course configuration.

These instructions will turn submissions downloaded from GitHub into a folder that you can drag into codePost.

----------

**Need help?** Shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork the scripts included [here](https://github.com/codepost-io/integration-github).
`;

  const instructions = <BlockMarkdown source={instructionText} />;

  return <FolderImport {...props} instructions={instructions} />;
};

export const JupyterFolderImport = (props: IUploadFormProps) => {
  const instructionText = `Importing Jupyter Notebook files works just like any other files.

Upload a folder with the following file structure.

\`\`\`
  folder/
    student1@school.edu/
      file1.ipynb
      file2.ipynb
    student2@school.edu,student3@school.edu/
      file1.ipynb
      file2.ipynb
  \`\`\``;

  const instructions = <BlockMarkdown source={instructionText} />;

  return <FolderImport {...props} instructions={instructions} />;
};
