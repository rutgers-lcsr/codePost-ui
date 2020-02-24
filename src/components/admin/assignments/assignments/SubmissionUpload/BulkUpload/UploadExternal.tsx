import * as React from 'react';

/* ant imports */
import { Collapse, Icon, Radio, Statistic, Switch, Upload, Typography } from 'antd';

import ReactMarkdown from 'react-markdown';

import BlockMarkdown from '../../../../../core/BlockMarkdown';

import { UploadFile } from 'antd/lib/upload/interface';

import { codePostFile, IProtoFileUpload, fileToProtoFileUpload, readZipTopLevel } from './../FileReader';

import { LMSImport } from './LMSImport';

import { CourseType } from '../../../../../../infrastructure/types';

import { IntegrationButton, INTEGRATIONS } from '../../../../../landing/Integrations';

const Panel = Collapse.Panel;
const Dragger = Upload.Dragger;

interface IUploadFormProps {
  rawFiles: codePostFile[];
  setRawFiles: any;
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  showImportOptions: boolean;
  mode?: string;
  students: string[];
  course: CourseType;
  setIntegration: (mode?: string) => void;
}

const UploadExternal = (props: IUploadFormProps) => {
  let content;
  switch (props.mode) {
    case 'canvas':
      content = <LMSImport {...props} />;
      break;
    case 'blackboard':
      content = <LMSImport {...props} />;
      break;
    case 'brightspace':
      content = <LMSImport {...props} />;
      break;
    case 'github':
      content = <GitHub {...props} />;
      break;
    case 'jupyter':
      content = <Jupyter {...props} />;
      break;
    case 'more':
      content = <div>Can't find what you're looking for? Let us know at team@codepost.io.</div>;
      break;
    default:
      if (!props.showImportOptions) {
        content = <Normal {...props} />;
      } else {
        content = (
          <div style={{ margin: '15px 0px' }}>
            <Typography.Title level={4} style={{ marginBottom: 15 }}>
              Choose a tool to import from:
            </Typography.Title>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IntegrationButton integration={INTEGRATIONS['canvas']} onClick={props.setIntegration} active={false} />
              <div style={{ width: '20px' }} />
              <IntegrationButton
                integration={INTEGRATIONS['blackboard']}
                onClick={props.setIntegration}
                active={false}
              />
              <div style={{ width: '20px' }} />
              <IntegrationButton
                integration={INTEGRATIONS['brightspace']}
                onClick={props.setIntegration}
                active={false}
              />
              <div style={{ width: '20px' }} />
              <IntegrationButton integration={INTEGRATIONS['github']} onClick={props.setIntegration} active={false} />
              <div style={{ width: '20px' }} />
              <IntegrationButton integration={INTEGRATIONS['jupyter']} onClick={props.setIntegration} active={false} />
              <div style={{ width: '20px' }} />
              <IntegrationButton integration={INTEGRATIONS['more']} onClick={props.setIntegration} active={false} />
            </div>
          </div>
        );
      }
  }

  return content;
};

const beforeUploadDirectory = (files: UploadFile[], callback: any) => {
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

const beforeUploadZip = (files: UploadFile[], callback: any) => {
  const beforeUpload = async (file: File, fileList: File[]) => {
    const unzippedFiles = await readZipTopLevel(file);

    const filteredFiles = unzippedFiles.filter((file: File) => {
      const protoFileUpload: IProtoFileUpload = fileToProtoFileUpload(file);
      return protoFileUpload.path.split('/').length > 1;
    });

    callback(filteredFiles);

    // prevent upload
    return Promise.reject();
  };
  return beforeUpload;
};

const Normal = (props: IUploadFormProps) => {
  const [zipMode, setZipMode] = React.useState(false);

  const exampleText = `\`\`\`
  folder/
    student1@university.edu/
      file1.java
      file2.txt
    student2@university.edu,student3@university.edu/
      file1.java
      file2.txt
  \`\`\``;

  const beforeUpload = beforeUploadDirectory(props.rawFiles, props.setRawFiles);

  // const beforeUpload = zipMode
  //   ? beforeUploadZip(props.rawFiles, props.setRawFiles)
  //   : beforeUploadDirectory(props.rawFiles, props.setRawFiles);

  const onChange = (checked: boolean) => {
    setZipMode(checked);
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
      <Switch checked={zipMode} onChange={onChange} /> <span> Upload Zip File</span>
      <br />
      <br />
      <Dragger showUploadList={false} directory={true} multiple={false} beforeUpload={beforeUpload}>
        <p className="ant-upload-drag-icon">
          <Icon type="inbox" />
        </p>
        <p className="ant-upload-text">Click or drag a folder to upload</p>
        <p className="ant-upload-hint">Make sure you use the format specified in the Instructions above.</p>
      </Dragger>
      <br />
      {zipMode ? (
        <Statistic title="Unzipped and uploaded files" value={props.rawFiles.length} />
      ) : (
        <Statistic title="Uploaded files" value={props.rawFiles.length} />
      )}
    </div>
  );
};

const GitHub = (props: IUploadFormProps) => {
  const [zipMode, setZipMode] = React.useState(false);
  const beforeUpload = beforeUploadDirectory(props.rawFiles, props.setRawFiles);
  // const beforeUpload = zipMode
  //   ? beforeUploadZip(props.rawFiles, props.setRawFiles)
  //   : beforeUploadDirectory(props.rawFiles, props.setRawFiles);

  const onChange = (checked: boolean) => {
    setZipMode(checked);
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
      <Collapse defaultActiveKey={['1']}>
        <Panel header="Instructions" key="1">
          <BlockMarkdown source={instructions} />
        </Panel>
      </Collapse>
      <br />
      <br />
      <Switch checked={zipMode} onChange={onChange} /> <span> Upload Zip File</span>
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
      {zipMode ? (
        <Statistic title="Unzipped and uploaded files" value={props.rawFiles.length} />
      ) : (
        <Statistic title="Uploaded files" value={props.rawFiles.length} />
      )}
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

  const [zipMode, setZipMode] = React.useState(false);
  const beforeUpload = beforeUploadDirectory(props.rawFiles, props.setRawFiles);
  // const beforeUpload = zipMode
  //   ? beforeUploadZip(props.rawFiles, props.setRawFiles)
  //   : beforeUploadDirectory(props.rawFiles, props.setRawFiles);

  const onChange = (checked: boolean) => {
    setZipMode(checked);
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
      <Switch checked={zipMode} onChange={onChange} /> <span> Upload Zip File</span>
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
      {zipMode ? (
        <Statistic title="Unzipped and uploaded files" value={props.rawFiles.length} />
      ) : (
        <Statistic title="Uploaded files" value={props.rawFiles.length} />
      )}
    </div>
  );
};

export default UploadExternal;
