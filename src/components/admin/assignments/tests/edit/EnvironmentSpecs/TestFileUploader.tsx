/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import React, { useState } from 'react';

import { DeleteOutlined, PlusCircleOutlined, UploadOutlined } from '@ant-design/icons';

/* library imports  */
import { Button, message, Modal, Switch, Table, Upload } from 'antd';

/* codePost object imports  */
import { SolutionFileType } from '../../../../../../infrastructure/autograder/solutionFile';
import { HelperFileType } from '../../../../../../infrastructure/autograder/helperFile';
import { BinaryExtensions } from '../../../../../../infrastructure/file';

import { fileToProtoFileUpload } from '../../../assignments/SubmissionUpload/FileReader';

import { IDirectoryStructure, IFolder } from '../../../../../code-review/menu/fileMenuUtils';

const { warning } = Modal;

interface IUploadProps {
  directory: IDirectoryStructure<SolutionFileType | HelperFileType> | undefined;
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

  const deleteFolder = async (folder: IFolder<SolutionFileType | HelperFileType>) => {
    const filePromises = folder.files.map((f) => {
      return props.deleteFile(f.id);
    });
    const folderPromises: any = folder.folders.map((f) => {
      return deleteFolder(f);
    });

    return await Promise.all([...filePromises, ...folderPromises]);
  };

  const deleteAll = async () => {
    if (props.directory) {
      warning({
        title: 'Are you sure you want to delete all files?',
        content: '',
        okText: 'Delete',
        async onOk() {
          const filePromises = props.directory!.files.map((f) => deleteFile(f.id));
          const folderPromises: any = props.directory!.folders.map((f) => deleteFolder(f));
          return await Promise.all([...filePromises, ...folderPromises]);
        },
        onCancel() {},
      });
    }
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
        const split = file.webkitRelativePath && file.webkitRelativePath.split('/');
        const path = split
          ? split
              .slice(0, split.length - 1)
              .join('/')
              .trim()
              .toLowerCase()
          : '';
        setNewFiles((prevState) => {
          const oldFiles = prevState.filter((f) => {
            return f.name !== file.name || f.path !== file.path;
          });
          return [...oldFiles, { uid: `${counter}-${file.name}`, code: reader.result, name: file.name, path: path }];
        });
        setCounter(counter + 1);
      }
    };
    const protoFileUpload = fileToProtoFileUpload(file);
    if (BinaryExtensions.includes(protoFileUpload.extension.toLowerCase())) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }

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

  let files: any = [];
  let folders: any = [];
  const getFolderData = (folder: IFolder<SolutionFileType | HelperFileType>) => {
    const files = folder.files.map((file) => {
      return {
        key: file.id,
        name: file.name,
        delete: <DeleteOutlined onClick={deleteFile.bind({}, file.id)} />,
      };
    });

    const folders: any = folder.folders.map((folder) => {
      return getFolderData(folder);
    });

    return {
      name: folder.name,
      delete: <Button onClick={deleteFolder.bind({}, folder)}>Delete Folder</Button>,
      children: [...files, ...folders],
    };
  };

  if (props.directory) {
    files = props.directory.files.map((file) => {
      return {
        key: file.id,
        name: file.name,
        delete: <DeleteOutlined onClick={deleteFile.bind({}, file.id)} />,
      };
    });

    folders = props.directory.folders.map((folder) => {
      return getFolderData(folder);
    });
  }

  const footer = [
    <Button
      type="danger"
      disabled={!(props.directory && (props.directory.files.length > 0 || props.directory.folders.length > 0))}
      ghost={true}
      onClick={deleteAll}
    >
      Delete all
    </Button>,
    <Button type="primary" disabled={newFiles.length === 0} onClick={saveNewFiles}>
      Save
    </Button>,
  ];

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      {props.icon ? (
        <PlusCircleOutlined onClick={toggleVisible} />
      ) : (
        <Button onClick={toggleVisible} style={{ marginTop: 20 }}>
          Add / Remove Files
        </Button>
      )}
      <Modal open={visible} onCancel={toggleVisible} width={750} footer={footer} title={props.title}>
        <Table columns={columns} dataSource={[...files, ...folders]} />
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
            <UploadOutlined /> Add Files
          </Button>
        </Upload>
        <div style={{ marginTop: 15 }}>
          Upload directory: &nbsp;
          <Switch onChange={toggleDir} />
        </div>
      </Modal>
    </div>
  );
};
