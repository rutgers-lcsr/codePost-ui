/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Icon, Modal, Tooltip, Upload } from 'antd';
import { UploadChangeParam } from 'antd/lib/upload';

/* other library imports */
import _ from 'lodash';

/* codePost imports */
import { CourseType } from '../../infrastructure/course';

import CPButton from '../core/CPButton';

import { createDemoCourse } from '../utils/DemoCourse';

import { acceptedFilesString } from '../admin/assignments/assignments/AcceptedFileTypes';

/**********************************************************************************************************************/

interface IOnboardingSelectorProps {
  title: string | React.ReactNode;
  options: React.ReactNode[];
  message: string;
  footer: string;
  visible: boolean;
  onCancel: () => void;
  footerButtons: React.ReactNode | null;
  closable?: boolean;
}

const OnboardingSelector = (props: IOnboardingSelectorProps) => {
  return (
    <Modal
      title={props.title}
      visible={props.visible}
      onCancel={props.onCancel}
      footer={props.footerButtons}
      width={600}
      closable={props.closable === undefined ? true : props.closable}
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
  visible: boolean;
  onCancel: () => void;
  email: string;
  onDemoCreate: (course?: CourseType) => void;
  demoCourseExists: boolean;
}

const AdminOnboardingSelector = (props: IProps) => {
  const [loading, setLoading] = React.useState(false);

  // call prop function onClick which triggers tour
  // FIXME: hard-coded product tour id
  const tour1 = (
    <CPButton cpType="primary" block href={'/code/1/?onboarding=true&product_tour_id=49817'}>
      Annotate some code!
    </CPButton>
  );

  const handleDemoCourse = () => {
    setLoading(true);
    if (!props.demoCourseExists) {
      createDemoCourse(`${props.email.split('@')[0]}'s course`, props.email.split('@')[1]).then((course) => {
        setLoading(false);
        props.onDemoCreate(course);
      });
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

  const message = `Want to learn how codePost works in less
     than 5 minutes? Choose from one of the options below.`;

  const footer = `If you want to get started by exploring on your own, you can always activate these tutorials
      by typing "intro tutorials" into the chat box on the bottom right of this screen`;

  return (
    <OnboardingSelector
      title={
        <span>
          Welcome to the codePost Admin Console! <Icon type="smile" theme="twoTone" twoToneColor={'#24be85'} />
        </span>
      }
      options={[tour1, tour2]}
      visible={props.visible}
      onCancel={props.onCancel}
      message={message}
      footer={footer}
      footerButtons={null}
    />
  );
};

/**********************************************************************************************************************/

interface ICodeConsoleOnboardingProps {
  visible: boolean;
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

  let title;
  let options = [];
  let message;
  const footer = '';
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
            if (typeof reader.result === 'string') {
              resolve({ name: toRead.name, data: reader.result });
            } else {
              reject();
            }
          };
          reader.readAsText(toRead);
        });
      };

      if (fileList.length === 1) {
        // Case 1: If a user uploads one file, then read that file individually
        readFile(file).then((beenRead: IFileType) => {
          const newFiles = files.filter((el) => {
            return el.name !== beenRead.name;
          });
          setFiles([...newFiles, { name: beenRead.name, data: beenRead.data }]);
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
        Promise.all(promises).then((beenReadFiles) => {
          const newFiles = files.filter((el) => {
            return fileNames.indexOf(el.name) === -1;
          });
          setFiles([...newFiles, ...beenReadFiles]);
        });
      }

      // prevent upload
      return false;
    };

    const uploader = (
      <Upload
        beforeUpload={beforeUpload}
        listType="text"
        multiple={true}
        onChange={onChange}
        accept={acceptedFilesString}
      >
        <CPButton cpType="secondary">
          <Icon type="upload" /> Click to Upload
        </CPButton>
      </Upload>
    );

    const uploadFiles = () => {
      props.onUploadConfirm(files);
    };

    const MIN_FILES_FOR_DEMO = 2;

    title = (
      <span>
        Welcome to codePost! <Icon type="smile" theme="twoTone" twoToneColor={'#24be85'} />
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
      <CPButton cpType="primary" block onClick={setUploading.bind(true)}>
        Upload your own code
      </CPButton>
    );

    const useDefaultFile = (
      <CPButton cpType="secondary" block onClick={props.onUploadConfirm.bind(true, [])}>
        No code handy? Use some default files
      </CPButton>
    );

    title = (
      <span>
        Welcome to codePost! <Icon type="smile" theme="twoTone" twoToneColor={'#24be85'} />
      </span>
    );
    options = [uploadFile, useDefaultFile];
    message = "In this tour, you'll learn the basics of the code review console.";
  }

  return (
    <OnboardingSelector
      title={title}
      options={options}
      visible={props.visible}
      onCancel={props.onCancel}
      message={message}
      footer={footer}
      footerButtons={footerButtons}
      closable={false}
    />
  );
};

/**********************************************************************************************************************/

export { AdminOnboardingSelector, CodeConsoleOnboardingSelector };
