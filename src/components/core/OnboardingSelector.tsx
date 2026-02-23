// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

import { SmileTwoTone, UploadOutlined } from '@ant-design/icons';

/* antd imports */
import { Button, Divider, Modal, Tooltip, Upload } from 'antd';
import { UploadChangeParam } from 'antd/lib/upload';

import { colors } from '../../theme/colors';

/* codePost imports */
import { Course } from '../../api-client';

import CPButton from '../core/CPButton';

import { createDemoCourse } from '../utils/DemoCourse';
import { CODE_DEMO } from '../../routes';

/**********************************************************************************************************************/

interface IOnboardingSelectorProps {
  title: string | React.ReactNode;
  options: React.ReactNode[];
  message: string | React.ReactNode;
  footer: string;
  open: boolean;
  onCancel: () => void;
  footerButtons: React.ReactNode | null;
  closable?: boolean;
}

const OnboardingSelector = (props: IOnboardingSelectorProps) => {
  return (
    <Modal
      title={props.title}
      open={props.open}
      onCancel={props.onCancel}
      footer={props.footerButtons}
      width={600}
      closable={props.closable === undefined ? true : props.closable}
      maskClosable={false}
    >
      {props.message}
      <br />
      <br />
      {props.options.map((el, index) => {
        return (
          <div key={index.toString()}>
            {el}
            <br />
            <br />
          </div>
        );
      })}
      {props.footer.length > 0 ? (
        <div>
          <Divider />
          {props.footer}
        </div>
      ) : null}
    </Modal>
  );
};

/**********************************************************************************************************************/

interface IProps {
  open: boolean;
  onCancel: () => void;
  email: string;
  onDemoCreate: (course?: Course) => void;
  demoCourseExists: boolean;
}

const AdminOnboardingSelector = (props: IProps) => {
  const [loading, setLoading] = React.useState(false);

  // call prop function onClick which triggers tour
  const tour1 = (
    <CPButton cpType="primary" block href={`${CODE_DEMO}/`}>
      Annotate some code!
    </CPButton>
  );

  const handleDemoCourse = () => {
    setLoading(true);
    if (!props.demoCourseExists) {
      createDemoCourse(props.email, `${props.email.split('@')[0]}'s course`, props.email.split('@')[1]).then(
        (course: Course) => {
          setLoading(false);
          props.onDemoCreate(course);
        },
      );
    } else {
      setLoading(false);
      props.onDemoCreate();
    }

    // call prop function which triggers tour here
  };

  const tour2 = (
    <CPButton cpType="secondary" block onClick={handleDemoCourse} loading={loading}>
      Take a spin through a demo course
    </CPButton>
  );

  const hangTight = loading ? (
    <div style={{ textAlign: 'center', fontWeight: 500 }}>(This may take a minute. Please don't refresh the page.)</div>
  ) : null;

  const message = `Want to learn how codePost works in less
     than 5 minutes? Choose from one of the options below.`;

  const footer = `If you want to get started by exploring on your own, you can always activate these tutorials
      by typing "intro tutorials" into the chat box on the bottom right of this screen`;

  return (
    <OnboardingSelector
      title={
        <span>
          Welcome to the codePost Admin Console! <SmileTwoTone twoToneColor={colors.brandPrimary} />
        </span>
      }
      options={[tour1, tour2, hangTight]}
      open={props.open}
      onCancel={props.onCancel}
      message={message}
      footer={footer}
      footerButtons={null}
    />
  );
};

/**********************************************************************************************************************/

interface ICodeConsoleOnboardingProps {
  open: boolean;
  onCancel: () => void;
  onUploadConfirm: (files: Array<{ name: string; data: string }>) => void;
}

interface IFileType {
  name: string;
  data: string;
}

const CodeConsoleOnboardingSelector = (props: ICodeConsoleOnboardingProps) => {
  const [uploading, setUploading] = React.useState(false);
  const [files, setFiles] = React.useState([] as IFileType[]);
  const [errorText, setErrorText] = React.useState('');

  let title;
  let options = [];
  let message;
  let footerButtons = null;
  if (uploading) {
    const onChange = (info: UploadChangeParam) => {
      setFiles(
        files.filter((el) => {
          return info.fileList.some((el2) => {
            return el2.name === el.name;
          });
        }),
      );
    };

    const beforeUpload = (file: File, fileList: File[]) => {
      // NOTE: when uploading multiple files at once, this function
      // gets called once for each file. For example, uploading [file1, file2]
      // will fire off
      // 1. beforeUpload(file1, [file1, file2])
      // 2. beforeUpload(file2, [file1, file2])
      //
      // Could optimize by only uploading if fileList includes
      // files not already uploaded (although this would miss situations
      // where the client is re-uploading files with same name but different
      // content).

      // Asynchronously read contents of file
      const readFile = (toRead: File): Promise<IFileType> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string' && reader.result.length > 0) {
              resolve({ name: toRead.name, data: reader.result });
            } else {
              reject(toRead);
            }
          };
          reader.readAsText(toRead);
        });
      };

      if (fileList.length === 1) {
        // Case 1: If a user uploads one file, then read that file individually
        readFile(file)
          .then((beenRead: IFileType) => {
            const newFiles = files.filter((el) => {
              return el.name !== beenRead.name;
            });
            setFiles([...newFiles, { name: beenRead.name, data: beenRead.data }]);
          })
          .catch((triedToRead) => {
            const errorString = `${triedToRead.name} is empty. This demo requires non-empty files.`;
            setErrorText(errorString);
          });
      } else {
        // Case 2: If a user uploads multiple files at once, make sure we read all of them
        const fileNames = fileList.map((el) => {
          return el.name;
        });

        const promises: Array<Promise<IFileType>> = [];
        fileList.forEach((listFile) => {
          promises.push(readFile(listFile));
        });
        Promise.all(promises)
          .then((beenReadFiles) => {
            const toAdd = beenReadFiles.filter((el) => {
              return el.data.length > 0;
            });
            const newFiles = files.filter((el) => {
              return fileNames.indexOf(el.name) === -1;
            });
            setFiles([...newFiles, ...toAdd]);
          })
          .catch(() => {
            const errorString = 'This demo requires non-empty files.';
            setErrorText(errorString);
          });
      }

      // prevent upload
      return false;
    };

    const uploader = (
      <Upload beforeUpload={beforeUpload} listType="text" multiple={true} onChange={onChange}>
        <CPButton cpType="secondary">
          <UploadOutlined /> Click to Upload
        </CPButton>
      </Upload>
    );

    const uploadFiles = () => {
      props.onUploadConfirm(files);
    };

    const MIN_FILES_FOR_DEMO = 2;

    title = (
      <span>
        Welcome to codePost! <SmileTwoTone twoToneColor={colors.brandPrimary} />
      </span>
    );

    options = [uploader];

    message = `Upload at least ${MIN_FILES_FOR_DEMO} code files to annotate them in codePost.
    You can choose any files (they won't be saved)`;

    const goBack = () => {
      setFiles([]); // reset uploaded files store
      setUploading(false);
    };

    footerButtons = [
      <Button key="back" onClick={goBack}>
        Back
      </Button>,
      files.length < MIN_FILES_FOR_DEMO ? (
        <Tooltip title={`Upload at least ${MIN_FILES_FOR_DEMO} files to continue`}>
          <span>
            {' '}
            &nbsp;
            <CPButton key="forward" cpType="primary" disabled={true}>
              Get started
            </CPButton>
          </span>
        </Tooltip>
      ) : (
        <CPButton key="forward" cpType="primary" onClick={uploadFiles}>
          Get started
        </CPButton>
      ),
    ];
  } else {
    // call prop function onClick which triggers tour
    const uploadFile = (
      <CPButton cpType="secondary" block onClick={setUploading.bind(true)}>
        Upload your own code to annotate
      </CPButton>
    );

    const useDefaultFile = (
      <CPButton cpType="primary" block onClick={props.onUploadConfirm.bind(true, [])}>
        Annotate some sample code
      </CPButton>
    );

    title = (
      <span>
        Welcome to codePost! <SmileTwoTone twoToneColor={colors.brandPrimary} />
      </span>
    );
    options = [useDefaultFile, uploadFile];
    message = (
      <span style={{ fontSize: '15px' }}>
        We're going to show you how to annotate code in codePost. To get started,{' '}
        <b>select one of the options below.</b>
      </span>
    );
  }

  return (
    <OnboardingSelector
      title={title}
      options={options}
      open={props.open}
      onCancel={props.onCancel}
      message={message}
      footer={errorText}
      footerButtons={footerButtons}
      closable={false}
    />
  );
};

/**********************************************************************************************************************/

export { AdminOnboardingSelector, CodeConsoleOnboardingSelector };
