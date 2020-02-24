import React from 'react';

import { Progress, Table, Tag } from 'antd';

import { UPLOAD_STATUS } from './BulkUploadHelpers';

import { IProtoSubmission } from './../FileReader';

interface IProps {
  protoSubmissions: IProtoSubmission[];
  uploadMap: { [student: string]: UPLOAD_STATUS };
}
const BulkUploadComplete = (props: IProps) => {
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

export default BulkUploadComplete;
