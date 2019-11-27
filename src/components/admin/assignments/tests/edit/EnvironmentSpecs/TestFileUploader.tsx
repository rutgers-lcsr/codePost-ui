/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

/* library imports  */
import { Button, Icon, message, Modal, Switch, Table, Upload } from 'antd';

/* codePost object imports  */
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../infrastructure/autograder/helperFile';

interface IUploadProps {
  files: (SolutionFileType | HelperFileType)[];
  addFile: (name: string, code: string, path?: string) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  icon?: boolean;
  title: string;
}

/**********************************************************************************************************************/

export const TestFileUploader = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [newFiles, setNewFiles] = useState<any[]>([]);
  const [counter, setCounter] = useState(0);
  const [uploadDir, setUploadDir] = useState(false);

  /************************** API Functions ****************************/
  const deleteFile = async (id: number) => {
    await props.deleteFile(id);
    message.success(`File deleted!`);
  };

  const saveNewFiles = async () => {
    const promises = newFiles.map((newFile) => {
      return props.addFile(newFile.name, newFile.code, newFile.path);
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

        const split = file.webkitRelativePath && file.webkitRelativePath.split('/');
        const path = split
          ? split
              .slice(0, split.length - 1)
              .join('/')
              .trim()
              .toLowerCase()
          : '';
        setNewFiles((prevState) => {
          return [...prevState, { uid: `${counter}-${file.name}`, code: cleanedData, name: file.name, path: path }];
        });
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
      title: 'Delete',
      dataIndex: 'delete',
      key: 'delete',
    },
  ];

  const toggleDir = () => {
    setUploadDir(!uploadDir);
  };

  const data = props.files.map((file) => {
    return {
      name: file.name,
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
      <Modal
        visible={visible}
        onCancel={toggleVisible}
        width={750}
        okText="Save"
        onOk={saveNewFiles}
        title={props.title}
      >
        <Table columns={columns} dataSource={data} />
        <br />
        <Upload
          beforeUpload={beforeUpload}
          listType="text"
          multiple={true}
          showUploadList={true}
          onRemove={onRemove}
          fileList={newFiles}
          directory={uploadDir}
        >
          <Button>
            <Icon type="upload" /> Add Files
          </Button>
        </Upload>
        <div>
          Upload directory: &nbsp;
          <Switch onChange={toggleDir} />
        </div>
      </Modal>
    </div>
  );
};
