import * as React from 'react';

/* ant imports */
import { Collapse, Icon, Statistic, Upload } from 'antd';
const Panel = Collapse.Panel;
const Dragger = Upload.Dragger;

import ReactMarkdown from 'react-markdown';

import BlockMarkdown from '../../../core/BlockMarkdown';

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
      content = <Blackboard {...props} />;
      break;
    case 'jupyter':
      content = <Jupyter {...props} />;
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

  const instructions = `Follow
[these instructions on Github](https://github.com/codepost-io/integration-canvas)
to import Canvas submissions into codePost.

The python script will use the Canvas API to download assignment submissions to your local
machine in a file structure that codePost will recognize.

\`\`\`
  codepost_upload/
    student1@university.edu/
      file1.java
      file2.txt
    student2@university.edu,student3@university.edu/
      file1.java
      file2.txt
\`\`\`

The script will create a folder called \`codepost_upload\` which you can drag into this modal below.

----------

**Need help?** Shoot us an email at team@codepost.io

**Eager to automate?** Checkout the codePost upload [command line tool](https://github.com/codepost-io/codepost-tools)
and the [Python SDK](https://github.com/codepost-io/codepost-python)
`;

  return (
    <div>
      <Collapse defaultActiveKey={['1']}>
        <Panel header="Instructions" key="1">
          <BlockMarkdown source={instructions} />
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
      <br />
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

const Blackboard = (props: IUploadFormProps) => {
  const instructions = `Email team@codepost.io for details
on how current codePost users import submissions from Blackboard.

Or... **DIY!**

The codePost upload [command line tool](https://github.com/codepost-io/codepost-tools)
and the [Python SDK](https://github.com/codepost-io/codepost-python) have everything you need
to get submissions into codePost using one short script.

You can download submissions manually from Blackboard and then upload them. Or, you can automate
the whole process by authenticating to the Blackboard API.
  `;

  return (
    <div>
      <BlockMarkdown source={instructions} />
    </div>
  );
};

const Jupyter = (props: IUploadFormProps) => {
  const instructions = `Importing Jupyter Notebook files works just like any other files.

Upload a folder with the following file structure.

\`\`\`
  folder/
    student1@university.edu/
      file1.ipynb
      file2.ipynb
    student2@university.edu,student3@university.edu/
      file1.ipynb
      file2.ipynb
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
          <BlockMarkdown source={instructions} />
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

export default UploadForm;
