import * as React from 'react';

/* ant imports */
import { Collapse, Icon, Statistic, Upload } from 'antd';
const Panel = Collapse.Panel;
const Dragger = Upload.Dragger;

import ReactMarkdown from 'react-markdown';

interface IUploadFormProps {
  rawFiles: File[];
  setRawFiles: any;
  mode?: string;
}

const UploadForm = (props: IUploadFormProps) => {
  let content;
  switch (props.mode) {
    case 'canvas':
      content = <Canvas {...props} />;
      break;
    case 'blackboard':
      content = <div>blackboard</div>;
      break;
    case 'more':
      content = <div>Can't find what you're looking for? Let us know at team@codepost.io.</div>;
      break;
    default:
      content = <Normal {...props} />;
  }

  return content;
};

const Normal = (props: IUploadFormProps) => {
  const exampleText = `\`\`\`
  folder/
    student1@university.edu/
      file1.java
      file2.txt
    student2@university.edu,student3@university.edu/
      file1.java
      file2.txt
  \`\`\``;

  const beforeUpload = (file: File, fileList: File[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      props.setRawFiles(
        fileList.filter((el) => {
          return el.name[0] !== '.'; // filter our system files
        }),
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== '.') {
        // ignore system files
        const newList = [...props.rawFiles, file];
        props.setRawFiles(newList);
      }
    }

    // prevent upload
    return false;
  };

  return (
    <div>
      <Collapse>
        <Panel header="Instructions" key="1">
          Upload a folder with the following file structure.
          <br />
          <br />
          <ReactMarkdown source={exampleText} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <Dragger showUploadList={false} directory={true} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">Make sure you use the format specified in the Instructions above.</p>
      </Dragger>
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

const Canvas = (props: IUploadFormProps) => {
  const exampleText = `\`\`\`
  python script
  \`\`\``;

  const beforeUpload = (file: File, fileList: File[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      props.setRawFiles(
        fileList.filter((el) => {
          return el.name[0] !== '.'; // filter our system files
        }),
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== '.') {
        // ignore system files
        const newList = [...props.rawFiles, file];
        props.setRawFiles(newList);
      }
    }

    // prevent upload
    return false;
  };

  return (
    <div>
      <Collapse defaultActiveKey={['1']}>
        <Panel header="Instructions" key="1">
          This upload form is intended to make the Canvas upload as seamless as possible. Questions? Please email
          team@codepost.io.
          <br />
          <br />
          <ReactMarkdown source={exampleText} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <div className="cp-label cp-label--large cp-label--bold">Submissions</div>
          <Dragger showUploadList={false} directory={true} beforeUpload={beforeUpload}>
            <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p>
            <p className="ant-upload-text">Click or drag a folder to upload</p>
            <p className="ant-upload-hint">Folder of submissions.</p>
          </Dragger>
        </div>
        <div>
          <div className="cp-label cp-label--large cp-label--bold">Roster</div>
          <Dragger showUploadList={false} directory={false} beforeUpload={beforeUpload}>
            <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p>
            <p className="ant-upload-text">Click or drag a file to upload</p>
            <p className="ant-upload-hint">CSV of the course roster.</p>
          </Dragger>
        </div>
        <div>
          <div className="cp-label cp-label--large cp-label--bold">Partners (optional)</div>
          <Dragger showUploadList={false} directory={false} beforeUpload={beforeUpload}>
            <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p>
            <p className="ant-upload-text">Click or drag a file to upload</p>
            <p className="ant-upload-hint">CSV of the partner list for this assignment.</p>
          </Dragger>
        </div>
      </div>
      <br />
      <br />
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

export default UploadForm;
