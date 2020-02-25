import * as React from 'react';

/* ant imports */
import { Typography } from 'antd';

import { codePostFile, IProtoFileUpload } from './../FileReader';

import { LMSImport } from './LMSImport';

import { CourseType } from '../../../../../../infrastructure/types';

import { IntegrationButton, INTEGRATIONS } from '../../../../../landing/Integrations';

import { GithubFolderImport, JupyterFolderImport, NormalFolderImport } from './FolderImport';

import { BulkUploadFooter } from './BulkUploadComponents';

interface IUploadFormProps {
  processSubmissionsFromFiles: (
    files: codePostFile[],
    getStudentsFromFile: (file: IProtoFileUpload) => string[],
  ) => void;
  showImportOptions: boolean;
  mode?: string;
  students: string[];
  course: CourseType;
  setIntegration: (mode?: string) => void;
  onCancel: () => void;
  setImportOptions: (value: boolean) => void;
}

const UploadForm = (props: IUploadFormProps) => {
  // Show the upload options bar
  if (props.showImportOptions) {
    return (
      <div>
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
            <IntegrationButton integration={INTEGRATIONS['blackboard']} onClick={props.setIntegration} active={false} />
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
        <BulkUploadFooter
          backText="Back"
          onBack={props.setImportOptions.bind({}, false)}
          forwardText="Upload"
          onForward={() => {}}
          disableForward={true}
        />
      </div>
    );
  }

  switch (props.mode) {
    case 'canvas':
      return <LMSImport {...props} />;
    case 'blackboard':
      return <LMSImport {...props} />;
    case 'brightspace':
      return <LMSImport {...props} />;
    case 'github':
      return <GithubFolderImport {...props} />;
    case 'jupyter':
      return <JupyterFolderImport {...props} />;
    case 'more':
      return <div>Can't find what you're looking for? Let us know at team@codepost.io.</div>;
    default:
      return <NormalFolderImport {...props} />;
  }
};

export default UploadForm;
