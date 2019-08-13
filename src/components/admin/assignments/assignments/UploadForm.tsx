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

  const instructions = `# Process

See the 2 minute process in action [here](https://cl.ly/3945935491cc)!

1. Download the script (
[here](https://raw.githubusercontent.com/codepost-io/Canvas-Import/master/canvasToCodePost.py)) and install dependencies

\`\`\`
pip install pandas
\`\`\`

2. Place all the files in the same directory. Run the script

\`\`\`
python3 canvasToCodePost.py submissions roster.csv partners.csv
\`\`\`

3. Drag the newly created 'codePost_upload' folder in the box below!

# What you'll need

1. **The downloaded submissions from Canvas** (From Canvas, go to the Assignment page
and click "Download Submissions" – see [here](https://cl.ly/d5fc112207d1))

2. **The course roster** (\`roster.csv\`,
[template](https://raw.githubusercontent.com/codepost-io/Canvas-Import/master/roster_template.csv))

3. **(optional) The assignment partner list** (\`partners.csv\`,
[template](https://raw.githubusercontent.com/codepost-io/Canvas-Import/master/partners_template.csv))

Make sure each upload is in the correct format.
`;

  const codePostFormat = `\`\`\`
  assignmentFolder/
    student1@university.edu/
      file1.java
      file2.txt
    student2@university.edu,student3@university.edu/
      file1.java
      file2.txt
  \`\`\``;

  const canvasFormat = `\`\`\`
  assignmentFolder/
    studentone_123456_54321_file1.java
    studentone_123456_54322_file2.txt
    studenttwo_123456_54323_file1.java
    studenttwo_123456_54324_file2.txt
  \`\`\``;

  const formatPanel1 = `Canvas defaults to the following filenaming convention:

\`{last_name}{first_name}_{assignmentID}_{submissionID}_{filename}.{extension}\`
`;

  const formatPanel2 = `The roster will allow us to map names to emails (codePost usernames).
 The \`.csv\` file should have the following headers:

\`first_name, last_name, email\`
`;

  const formatPanel3 = `Each row will represent partners in a submission. Leaving out a student assumes they won't
have a partner for this assignment.

\`\`\`
partner1@university.edu, partner2@university.edu
solo1@university.edu
partner3@university.edu,partner4@university.edu,partner5@university.edu
\`\`\`
`;

  return (
    <div>
      <Collapse defaultActiveKey={['1']}>
        <Panel header="Instructions" key="1">
          Follow these instructions to import Canvas submissions into codePost.
          <br />
          <br />
          Our goal is to turn the Canvas folder structure into one that codePost recognizes.
          <br />
          <br />
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', width: '100%' }}>
            <div
              style={{
                padding: '10px',
                maxWidth: '360px',
              }}
            >
              <div className="cp-label cp-label--medium cp-label--bold">Canvas Format</div>
            </div>
            <div
              style={{
                padding: '10px',
                maxWidth: '360px',
              }}
            >
              <div className="cp-label cp-label--medium cp-label--bold">codePost Format</div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-evenly', alignItems: 'center', width: '100%' }}>
            <div
              style={{
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '5px',
                padding: '10px',
                backgroundColor: '#fafafa',
                maxWidth: '360px',
              }}
            >
              <ReactMarkdown source={canvasFormat} />
            </div>
            <div>
              <Icon type="arrow-right" />
            </div>
            <div
              style={{
                border: '1px solid rgba(0, 0, 0, 0.2)',
                borderRadius: '5px',
                backgroundColor: '#fafafa',
                padding: '10px',
                maxWidth: '360px',
              }}
            >
              <ReactMarkdown source={codePostFormat} />
            </div>
          </div>
          <br />
          <BlockMarkdown source={instructions} />
          <Collapse>
            <Panel header="(1) Canvas submissions format" key="1">
              <ReactMarkdown source={formatPanel1} />
            </Panel>
            <Panel header="(2) Roster format" key="2">
              <ReactMarkdown source={formatPanel2} />
            </Panel>
            <Panel header="(3) Partners format" key="3">
              <ReactMarkdown source={formatPanel3} />
            </Panel>
          </Collapse>
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
  return <div>coming soon!</div>;
};

export default UploadForm;
