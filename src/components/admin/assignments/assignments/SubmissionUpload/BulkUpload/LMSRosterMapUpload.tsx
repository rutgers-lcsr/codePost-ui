// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React, { useState } from 'react';

import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';

import { Alert, Button, Input, Modal, Upload } from 'antd';
import { RcFile } from 'antd/lib/upload/interface';

import { FolderToStudentMap, getIdentifierFromFolder } from './LMSImportHelpers';

import LogViewer from '../../../../../core/LogViewer';
interface IMappingUploadProps {
  onSave: (newMapping: { [id: string]: string }) => void;
  onCancel: () => void;
  isVisible: boolean;
  folderMap: FolderToStudentMap;
  idIndex: number;
  students: string[];
}

const LMSRosterMapUpload = (props: IMappingUploadProps) => {
  const [stringMap, setStringMap] = useState(folderMapToString(props.folderMap, props.idIndex));
  const [errors, setErrors] = useState<string[]>([]);

  React.useEffect(() => {
    setStringMap(folderMapToString(props.folderMap, props.idIndex));
  }, [props.isVisible]);

  const downloadTemplate = () => {
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(folderMapToString(props.folderMap, props.idIndex))}`;
    a.download = `Roster_Mapping.csv`;
    document.body.appendChild(a);
    a.click();
  };
  const beforeUpload = (file: RcFile) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setStringMap(reader.result);
      }
    };
    reader.readAsText(file);

    // prevent Ant upload component from trying to post file
    return false;
  };

  const validateMapping = () => {
    const errors: string[] = [];
    const rows = stringMap.split('\n');
    const validRows: { [email: string]: string } = {};
    const identifierList = Object.keys(props.folderMap).map((folderName) =>
      getIdentifierFromFolder(folderName, props.idIndex),
    );

    rows.forEach((row) => {
      if (!row.match(/\w+,\w+/g)) {
        errors.push(`Row doesn't match <identifier>,<email> syntax: ${row}`);
        return;
      }
      const [identifier, email] = row.split(',');

      if (!identifierList.includes(identifier)) {
        errors.push(`Identifier ${identifier} not in list of folder names.`);
        return;
      }
      if (!props.students.includes(email)) {
        errors.push(`Student ${email} not enrolled in this course.`);
        return;
      }

      if (identifier in validRows) {
        errors.push(`Identifier ${identifier} included twice in csv.`);
        return;
      }

      if (Object.values(validRows).includes(email)) {
        errors.push(`Student ${email} included twice in csv.`);
        return;
      }

      validRows[identifier] = email;
    });

    setErrors(errors);
    if (errors.length === 0) {
      props.onSave(validRows);
      props.onCancel();
    }
  };

  const saveBtn = <Button onClick={validateMapping}>Save</Button>;

  return (
    <Modal title="Upload a mapping" open={props.isVisible} onCancel={props.onCancel} footer={[saveBtn]}>
      <Alert
        type="info"
        message="You only need to create this mapping once. When you save it, this csv will be stored in your course, and will be
              automatically used for future uploads."
        style={{ marginBottom: 15 }}
      />
      {errors.length > 0 && (
        <div>
          Errors:
          <LogViewer text={errors.join('\n')} />
        </div>
      )}
      <div style={{ marginBottom: 10, float: 'right' }}>
        <Button type="default" onClick={downloadTemplate} style={{ marginRight: 5 }}>
          <DownloadOutlined /> Download .csv template
        </Button>
        <Upload beforeUpload={beforeUpload} showUploadList={false}>
          <Button type="primary">
            <UploadOutlined /> Upload a .csv file
          </Button>
        </Upload>
      </div>
      <Input.TextArea
        rows={6}
        value={stringMap}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStringMap(e.target.value)}
      />
    </Modal>
  );
};

const folderMapToString = (folderMap: FolderToStudentMap, idIndex: number) => {
  const stringArr = Object.keys(folderMap).map((folderName) => {
    const identifier = getIdentifierFromFolder(folderName, idIndex);
    return `${identifier},${folderMap[folderName] || ''}`;
  });
  return stringArr.join('\n');
};

export default LMSRosterMapUpload;
