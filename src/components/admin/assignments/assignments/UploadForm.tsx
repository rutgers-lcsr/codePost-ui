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

  const instructions = `These instructions will allow you to import submissions from Canvas to codePost.

0. Save [this script]
(https://raw.githubusercontent.com/codepost-io/integration-canvas/master/canvas-to-codepost.py) locally.

1. Open up \`canvas-to-codePost.py\` and replace \`<API_KEY>\` with your Canvas API Key.

2. Run the following. You can find your \`COURSE_ID\` and
\`ASSIGNMENT_ID\` by navigating to your assignment page on Canvas (something like
[https://canvas.instructure.com/courses/<COURSE_ID>/assignments/<ASSIGNMENT_ID>]
(https://canvas.instructure.com/courses/<COURSE_ID>/assignments/<ASSIGNMENT_ID>)).
\`\`\`
python3 canvas-to-codePost.py <COURSE_ID> <ASSIGNMENT_ID>
\`\`\`


3. The script will generate a folder called \`codepost_upload\`. Drag this folder into the space below.

----------

**Can't find your Canvas API key?** Try asking your organization's Canvas admin.

**Need help?** Learn how to troubleshoot [here](https://github.com/codepost-io/integration-canvas)
or shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork \`canvas-to-codePosy.py\` [here](https://github.com/codepost-io/integration-canvas).
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
