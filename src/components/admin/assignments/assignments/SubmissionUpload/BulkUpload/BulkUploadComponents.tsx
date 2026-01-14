/****************************************************************************
/** Description: This file includes components used for Bulk Upload
/****************************************************************************

/* react imports */

/* ant imports */
import { Button, Divider, Popconfirm, Progress, Table, Tag } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

import { UPLOAD_STATUS } from './BulkUploadHelpers';

import { IProtoSubmission } from './../FileReader';

import { encodeForLink } from '../../../../../../components/core/URLutils';
import { CourseType } from '../../../../../../infrastructure/types';

interface IUploadBulkFooterProps {
  onBack: (() => void) | null;
  backText: string;
  onForward: () => void;
  forwardText: string;
  disableForward: boolean;
}

//*************************** Modal footer *************************************
interface IUploadBulkFooterProps {
  onBack: (() => void) | null;
  backText: string;
  onForward: () => void;
  forwardText: string;
  disableForward: boolean;
  confirmText?: string;
}

export const BulkUploadFooter = (props: IUploadBulkFooterProps) => {
  const backButton = props.onBack !== null && (
    <Button key="back" onClick={props.onBack} style={{ marginRight: 10 }}>
      {props.backText}
    </Button>
  );
  const forwardButton = props.confirmText ? (
    <Popconfirm
      key="forward-confirm"
      title={props.confirmText}
      disabled={props.disableForward}
      onConfirm={props.onForward}
      overlayStyle={{ maxWidth: 300 }}
    >
      <Button key="forward" type="primary" disabled={props.disableForward}>
        {props.forwardText}
      </Button>
    </Popconfirm>
  ) : (
    <Button key="forward" type="primary" disabled={props.disableForward} onClick={props.onForward}>
      {props.forwardText}
    </Button>
  );

  return (
    <div style={{ width: '100%' }}>
      <Divider style={{ margin: '12px 0px' }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {backButton} {forwardButton}
      </div>
    </div>
  );
};

//******************** Visual when No Students are in the course ***********************

interface IUploadNoStudentsProps {
  course: CourseType;
}

export const BulkUploadNoStudents = (props: IUploadNoStudentsProps) => {
  return (
    <div>
      After you add students, you can get their submissions into codePost in two ways:
      <ul>
        <li>
          Allowing students to submit directly (learn more{' '}
          <a href="/docs/submission-upload#student-uploads" target="_blank" rel="noopener noreferrer">
            here
          </a>
          )
        </li>
        <li>
          Manually uploading submissions (learn more{' '}
          <a href="/docs/submission-upload#bulk-upload" target="_blank" rel="noopener noreferrer">
            here
          </a>
          )
        </li>
      </ul>
      <br />{' '}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Link to={`/admin/${encodeForLink(props.course.name)}/${encodeForLink(props.course.period)}/roster/students`}>
          <Button type="primary">Add students</Button>
        </Link>
      </div>
    </div>
  );
};

//******************** The header of the Upload dialog ***********************

interface IUploadHeaderProps {
  showImportOptions: boolean;
  toggleImportOptions: () => void;
}

export const BulkUploadHeader = (props: IUploadHeaderProps) => {
  return (
    <div>
      <div>
        <b>Tip:</b> Want to allow students to upload directly? Learn more{' '}
        <a href="/docs/submission-upload#student-uploads" target="_blank" rel="noopener noreferrer">
          here
        </a>
        .
      </div>
      {!props.showImportOptions && (
        <div style={{ margin: '15px 0px' }}>
          <b>Tip:</b> Looking to import submissions from a third-party tool (like your LMS)?{' '}
          <span>
            <Button size="small" onClick={props.toggleImportOptions}>
              View instructions
            </Button>
          </span>
        </div>
      )}
    </div>
  );
};

//******************** Visual modal for the completed bulk upload  ***********************
interface BulkUploadCompleteProps {
  protoSubmissions: IProtoSubmission[];
  uploadMap: { [student: string]: UPLOAD_STATUS };
}
export const BulkUploadComplete = (props: BulkUploadCompleteProps) => {
  const tableColumns = [
    {
      title: 'Students',
      dataIndex: 'students',
      key: 'students',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center' as 'center' | 'left' | 'right',
    },
  ];

  const tableRows = props.protoSubmissions.map((protoSubmission: IProtoSubmission, index: number) => {
    const students = protoSubmission.students;
    let status;
    switch (props.uploadMap[students[0]]) {
      case UPLOAD_STATUS.SUCCESS:
        status = (
          <Tag color="green" key={students[0]}>
            SUCCESS
          </Tag>
        );
        break;
      case UPLOAD_STATUS.ERROR:
        status = (
          <Tag color="red" key={students[0]}>
            ERROR
          </Tag>
        );
        break;
    }
    return {
      key: index,
      students: protoSubmission.students.join(', '),
      status,
    };
  });

  return (
    <div>
      <div>
        Reading files: &nbsp; <Progress percent={100} size="small" />
        Uploading submissions: &nbsp; <Progress percent={100} size="small" />
      </div>
      <br />
      <Table pagination={{ pageSize: 5 }} dataSource={tableRows} columns={tableColumns} />
    </div>
  );
};
