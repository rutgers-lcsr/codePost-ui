/* react imports */
import React, { useState } from 'react';

/* library imports  */
import { Button, Icon, message, Modal, Table, Upload } from 'antd';

/* codePost object imports  */
import { SolutionFileType } from '../../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../../infrastructure/autograder/helperFile';

interface IUploadProps {
  files: (SolutionFileType | HelperFileType)[];
  // FIXME: FILE ANY
  addFile: (name: string, code: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  icon?: boolean;
}

export const CodeUploader = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [counter, setCounter] = useState(0);

  /************************** API Functions ****************************/
  const deleteFile = async (id: number) => {
    await props.deleteFile(id);
    message.success(`File deleted!`);
  };

  const saveNewFiles = async () => {
    const promises = newFiles.map((newFile) => {
      return props.addFile(newFile.name, newFile.code);
    });
    await Promise.all(promises);
    message.success(`File(s) uploaded successfully`);
    setNewFiles([]);
  };

  /************************** State Change Functions ****************************/
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const beforeUpload = (file: any, fileList: any) => {
    const reader = new FileReader();
    reader.onload = async () => {
      if (reader.result) {
        const cleanedData = typeof reader.result === 'string' ? reader.result.replace(/\0/g, '') : reader.result;
        const oldFiles = [...newFiles];
        setNewFiles([...oldFiles, { uid: `${counter}-${file.name}`, code: cleanedData, name: file.name }]);
        setCounter(counter + 1);
      }
    };
    reader.readAsText(file);

    return false;
  };

  const onRemove = (removedFile: any) => {
    const updatedFiles = newFiles.filter((file) => {
      return file.name !== removedFile.name;
    });
    setNewFiles(updatedFiles);
  };
  /************************** Return ****************************/
  const columns = [
    {
      title: 'File Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Date uploaded',
      dataIndex: 'created',
      key: 'created',
    },
    {
      title: 'Delete',
      dataIndex: 'delete',
      key: 'delete',
    },
  ];

  const data = props.files.map((file) => {
    return {
      name: file.name,
      created: file.created,
      delete: <Icon onClick={deleteFile.bind({}, file.id)} type="delete" />,
    };
  });

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {props.icon ? (
        <Icon onClick={toggleVisible} type="plus-circle" />
      ) : (
        <Button onClick={toggleVisible} style={{ marginTop: 20 }}>
          Add / Remove Files
        </Button>
      )}
      <Modal visible={visible} onCancel={toggleVisible} footer={null} width={750}>
        <Table columns={columns} dataSource={data} />
        <Upload
          beforeUpload={beforeUpload}
          listType="text"
          multiple={false}
          showUploadList={true}
          onRemove={onRemove}
          fileList={newFiles}
        >
          <Button>
            <Icon type="upload" /> Add Files
          </Button>
        </Upload>
        <Button disabled={newFiles.length === 0} onClick={saveNewFiles}>
          Save new files
        </Button>
      </Modal>
    </div>
  );
};
