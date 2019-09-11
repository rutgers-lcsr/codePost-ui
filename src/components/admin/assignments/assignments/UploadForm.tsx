import * as React from "react";

/* ant imports */
import { Collapse, Icon, Radio, Statistic, Upload } from "antd";

import ReactMarkdown from "react-markdown";

import BlockMarkdown from "../../../core/BlockMarkdown";

const Panel = Collapse.Panel;
const Dragger = Upload.Dragger;

interface IUploadFormProps {
  rawFiles: File[];
  setRawFiles: any;
  mode?: string;
}

const UploadForm = (props: IUploadFormProps) => {
  let content;
  switch (props.mode) {
    case "canvas":
      content = <Canvas {...props} />;
      break;
    case "blackboard":
      content = <Blackboard {...props} />;
      break;
    case "brightspace":
      content = <Brightspace {...props} />;
      break;
    case "github":
      content = <GitHub {...props} />;
      break;
    case "jupyter":
      content = <Jupyter {...props} />;
      break;
    case "more":
      content = (
        <div>
          Can't find what you're looking for? Let us know at team@codepost.io.
        </div>
      );
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
        fileList.filter(el => {
          return el.name[0] !== "."; // filter our system files
        })
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== ".") {
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
      <Dragger
        showUploadList={false}
        directory={true}
        beforeUpload={beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">
          Make sure you use the format specified in the Instructions above.
        </p>
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
        fileList.filter(el => {
          return el.name[0] !== "."; // filter our system files
        })
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== ".") {
        // ignore system files
        const newList = [...props.rawFiles, file];
        props.setRawFiles(newList);
      }
    }

    // prevent upload
    return false;
  };

  const [selection, setSelection] = React.useState<boolean | undefined>(
    undefined
  );

  const yesKey = () => {
    setSelection(true);
  };

  const noKey = () => {
    setSelection(false);
  };

  let instructions;

  if (selection) {
    const scriptUrl =
      // tslint:disable-next-line:max-line-length
      "https://raw.githubusercontent.com/codepost-io/integration-canvas/master/A_ImportingWithAPIKey/canvas_to_codepost_api.py";
    instructions = `
See [GitHub](https://github.com/codepost-io/integration-canvas) for more details.

These instructions will help you download submissions from Canvas and upload them to codePost.

0. Save [this script](${scriptUrl}) locally.

1. Open \`canvas_to_codePost_api.py\` and replace \`<API_KEY>\` with your Canvas API Key.

2. From the command line, run \`python3 canvas_to_codepost_api.py <COURSE_ID> <ASSIGNMENT_ID>\`

3. The script will generate a folder called \`codepost_upload\`. Drag this folder into the space below.

----------

**Can't find your Canvas API key?** Try asking your organization's Canvas admin.

**Need help?** Learn how to troubleshoot [here](https://github.com/codepost-io/integration-canvas)
or shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork \`canvas_to_codePost_api.py\` [here](https://github.com/codepost-io/integration-canvas).
`;
  } else {
    const scriptUrl =
      // tslint:disable-next-line:max-line-length
      "https://raw.githubusercontent.com/codepost-io/integration-canvas/master/B_ImportingWithoutAPIKey/canvas_to_codepost_manual.py";
    instructions = `
See [GitHub](https://github.com/codepost-io/integration-canvas) for more details.

These instructions will turn submissions downloaded from Canvas into a folder that you can drag into codePost.

0. Download submissions from Canvas (Course -> Assignments -> Assignment -> Download Submissions)

1. Create a [roster.csv]
(https://raw.githubusercontent.com/codepost-io/integration-canvas/master/B_ImportingWithoutAPIKey/sample_roster.csv)

3. Download this [script](${scriptUrl})

3. From the command line, run \`python3 canvas_to_codepost_manual.py submissions roster.csv\`

4. The script will generate a folder called \`codepost_upload\`. Drag this folder into the space below.

----------

**Can't find your Canvas API key?** Try asking your organization's Canvas admin.

**Need help?** Learn how to troubleshoot [here](https://github.com/codepost-io/integration-canvas)
or shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork \`canvas_to_codePost_manual.py\` [here](https://github.com/codepost-io/integration-canvas).
`;
  }

  return (
    <div>
      <Radio.Group
        buttonStyle="solid"
        style={{ width: "100%", textAlign: "center" }}
        value={selection}
      >
        <Radio.Button
          value={true}
          style={{ width: "40%", textAlign: "center" }}
          onClick={yesKey}
        >
          I have a Canvas API Key
        </Radio.Button>
        <Radio.Button
          value={false}
          style={{ width: "40%", textAlign: "center" }}
          onClick={noKey}
        >
          I do not have a Canvas API Key
        </Radio.Button>
      </Radio.Group>
      <br />
      <br />
      {selection !== undefined ? (
        <div>
          <Collapse defaultActiveKey={["1"]}>
            <Panel header="Instructions" key="1">
              <BlockMarkdown source={instructions} />
            </Panel>
          </Collapse>
          <br />
          <br />
          <Dragger
            showUploadList={false}
            directory={true}
            beforeUpload={beforeUpload}
          >
            <p className="ant-upload-drag-icon">
              <Icon type="inbox" />
            </p>
            <p className="ant-upload-text">Click or drag a folder to upload</p>
            <p className="ant-upload-hint">
              Make sure you use the format specified in the Instructions above.
            </p>
          </Dragger>
          <br />
          <br />
          <br />
          <Statistic title="Uploaded files" value={props.rawFiles.length} />
        </div>
      ) : null}
    </div>
  );
};

const Brightspace = (props: IUploadFormProps) => {
  const beforeUpload = (file: File, fileList: File[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      props.setRawFiles(
        fileList.filter(el => {
          return el.name[0] !== "."; // filter our system files
        })
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== ".") {
        // ignore system files
        const newList = [...props.rawFiles, file];
        props.setRawFiles(newList);
      }
    }

    // prevent upload
    return false;
  };

  const instructions = `
See [GitHub](https://github.com/codepost-io/integration-brightspace) for more details.

These instructions will turn submissions downloaded from Brightspace into a folder that you can drag into codePost.

0. Download submissions from Brightspace (Course -> Assignments -> <Assignment> -> <Select All> -> Download)

1. Create a [roster.csv]
(https://raw.githubusercontent.com/codepost-io/integration-brightspace/master/sample_roster.csv)

3. Download this [script]
(https://raw.githubusercontent.com/codepost-io/integration-brightspace/master/brightspace_to_codepost_manual.py)

3. From the command line, run \`python3 brightspace_to_codepost_manual.py submissions roster.csv\`

4. The script will generate a folder called \`codepost_upload\`. Drag this folder into the space below.

----------

**Need help?** Learn how to troubleshoot [here](https://github.com/codepost-io/integration-brightspace)
or shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork \`brightspace_to_codepost_manual.py\` [here](https://github.com/codepost-io/integration-brightspace).
`;

  return (
    <div>
      <Collapse defaultActiveKey={["1"]}>
        <Panel header="Instructions" key="1">
          <BlockMarkdown source={instructions} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <Dragger
        showUploadList={false}
        directory={true}
        beforeUpload={beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">
          Make sure you use the format specified in the Instructions above.
        </p>
      </Dragger>
      <br />
      <br />
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

const Blackboard = (props: IUploadFormProps) => {
  const beforeUpload = (file: File, fileList: File[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      props.setRawFiles(
        fileList.filter(el => {
          return el.name[0] !== "."; // filter our system files
        })
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== ".") {
        // ignore system files
        const newList = [...props.rawFiles, file];
        props.setRawFiles(newList);
      }
    }

    // prevent upload
    return false;
  };

  const instructions = `
See [GitHub](https://github.com/codepost-io/integration-blackboard) for more details.

These instructions will turn submissions downloaded from Blackboard into a folder that you can drag into codePost.

0. Download submissions from Blackboard (Course -> Grade Center -> <Assignment Column> -> Assignment File Download)

1. Create a [roster.csv]
(https://raw.githubusercontent.com/codepost-io/integration-blackboard/master/sample_roster.csv)

3. Download this [script]
(https://raw.githubusercontent.com/codepost-io/integration-blackboard/master/blackboard_to_codepost_manual.py)

3. From the command line, run \`python3 blackboard_to_codepost_manual.py submissions roster.csv\`

4. The script will generate a folder called \`codepost_upload\`. Drag this folder into the space below.

----------

**Need help?** Learn how to troubleshoot [here](https://github.com/codepost-io/integration-blackboard)
or shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork \`blackboard_to_codepost_manual.py\` [here](https://github.com/codepost-io/integration-blackboard).
`;

  return (
    <div>
      <Collapse defaultActiveKey={["1"]}>
        <Panel header="Instructions" key="1">
          <BlockMarkdown source={instructions} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <Dragger
        showUploadList={false}
        directory={true}
        beforeUpload={beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">
          Make sure you use the format specified in the Instructions above.
        </p>
      </Dragger>
      <br />
      <br />
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

const GitHub = (props: IUploadFormProps) => {
  const beforeUpload = (file: File, fileList: File[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      props.setRawFiles(
        fileList.filter(el => {
          return el.name[0] !== "."; // filter our system files
        })
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== ".") {
        // ignore system files
        const newList = [...props.rawFiles, file];
        props.setRawFiles(newList);
      }
    }

    // prevent upload
    return false;
  };

  const instructions = `
See [GitHub](https://github.com/codepost-io/integration-github) for more details.

Choose the instructions that best apply to your GitHub course configuration.

These instructions will turn submissions downloaded from GitHub into a folder that you can drag into codePost.

----------

**Need help?** Shoot us an email at team@codepost.io

**Want to customize submission upload?** Check out our [Python SDK](https://github.com/codepost-io/codepost-python).
You can also fork the scripts included [here](https://github.com/codepost-io/integration-github).
`;

  return (
    <div>
      <Collapse defaultActiveKey={["1"]}>
        <Panel header="Instructions" key="1">
          <BlockMarkdown source={instructions} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <Dragger
        showUploadList={false}
        directory={true}
        beforeUpload={beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">
          Make sure you use the format specified in the Instructions above.
        </p>
      </Dragger>
      <br />
      <br />
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

const Jupyter = (props: IUploadFormProps) => {
  const instructions = `Importing Jupyter Notebook files works just like any other files.

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

  const beforeUpload = (file: File, fileList: File[]) => {
    if (fileList.length > 1) {
      // Case 1: use has selected a folder via menu, which will place all files into
      // fileList
      props.setRawFiles(
        fileList.filter(el => {
          return el.name[0] !== "."; // filter our system files
        })
      );
    } else {
      // Case 2: user drags in a folder. This will cause each file to uploaded such that fileList
      // contains only one file at a time. So add these files one-by-one to state.rawFiles
      if (file.name[0] !== ".") {
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
      <Collapse defaultActiveKey={["1"]}>
        <Panel header="Instructions" key="1">
          <BlockMarkdown source={instructions} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <Dragger
        showUploadList={false}
        directory={true}
        beforeUpload={beforeUpload}
      >
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">
          Make sure you use the format specified in the Instructions above.
        </p>
      </Dragger>
      <br />
      <Statistic title="Uploaded files" value={props.rawFiles.length} />
    </div>
  );
};

export default UploadForm;
