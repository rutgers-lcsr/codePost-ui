/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* antd imports */
import { Button, Divider, Icon, Modal, Upload } from 'antd';

/* codePost imports */
import CPButton from '../core/CPButton';

import { createDemoCourse } from '../utils/DemoCourse';

/**********************************************************************************************************************/

interface IOnboardingSelectorProps {
  title: string | React.ReactNode;
  options: React.ReactNode[];
  message: string;
  footer: string;
  visible: boolean;
  onCancel: () => void;
  footerButtons: React.ReactNode | null;
}

const OnboardingSelector = (props: IOnboardingSelectorProps) => {
  return (
    <Modal
      title={props.title}
      visible={props.visible}
      onCancel={props.onCancel}
      footer={props.footerButtons}
      width={600}
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
}

const AdminOnboardingSelector = (props: IProps) => {
  const [loading, setLoading] = React.useState(false);

  // call prop function onClick which triggers tour
  const tour1 = (
    <CPButton cpType="primary" block>
      Annotate some code!
    </CPButton>
  );

  const handleDemoCourse = () => {
    setLoading(true);
    createDemoCourse(`${props.email.split('@')[0]}'s course`, props.email.split('@')[1]).then(() => {
      setLoading(false);
    });

    // call prop function which triggers tour here
  };

  const tour2 = (
    <CPButton cpType="secondary" block onClick={handleDemoCourse} loading={loading}>
      Take a spin through a demo course
    </CPButton>
  );

  const message = `Want to learn how codePost works in less
     than 5 minutes? Choose from one of the options below.`;

  const footer = `If you want to get started on your own, you can always take these tutorials
      by asking about the "intro tutorials" in the chat box on the bottom right of this screen`;

  return (
    <OnboardingSelector
      title={
        <span>
          Welcome to codePost! <Icon type="smile" theme="twoTone" twoToneColor={'#24be85'} />
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
    const beforeUpload = (file: File, fileList: File[]) => {
      const readFile = (toRead: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            const newFiles = files.filter((el) => {
              return el.name !== toRead.name;
            });
            setFiles([...newFiles, { name: toRead.name, data: reader.result }]);
          }
        };
        reader.readAsText(toRead);
      };

      // If a user uploads one file, then read that file individually
      // If a user uploads multiple files at once, make sure we read all of them
      if (fileList.length === 1) {
        readFile(file);
      } else {
        fileList.forEach((listFile) => {
          readFile(listFile);
        });
      }

      // prevent upload
      return false;
    };

    const uploader = (
      <Upload beforeUpload={beforeUpload} listType="text" multiple={true}>
        <CPButton cpType="secondary">
          <Icon type="upload" /> Click to Upload
        </CPButton>
      </Upload>
    );

    const uploadFiles = () => {
      props.onUploadConfirm(files);
    };

    title = (
      <span>
        Welcome to codePost! <Icon type="smile" theme="twoTone" twoToneColor={'#24be85'} />
      </span>
    );

    options = [uploader];

    message = "Upload 3 code files to annotate them in codePost. You can choose any files (they won't be saved)";

    const goBack = () => {
      setUploading(false);
    };

    footerButtons = [
      <Button key="back" onClick={goBack}>
        Back
      </Button>,
      <CPButton key="forward" cpType="primary" disabled={files.length !== 3} onClick={uploadFiles}>
        Get started
      </CPButton>,
    ];
  } else {
    // call prop function onClick which triggers tour
    const uploadFile = (
      <CPButton cpType="primary" block onClick={setUploading.bind(true)}>
        Upload your own code
      </CPButton>
    );

    const useDefaultFile = (
      <CPButton cpType="secondary" block>
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
    />
  );
};

/**********************************************************************************************************************/

export { AdminOnboardingSelector, CodeConsoleOnboardingSelector };
