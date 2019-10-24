/* react imports */
import React, { useState } from 'react';

/* library imports  */
import { Button, Icon, Layout, Menu, message, Modal, Table, Upload } from 'antd';
import { ClickParam } from 'antd/lib/menu';

/* codePost object imports  */
import { AssignmentType } from '../../../../../../../infrastructure/assignment';
import { SolutionFileType } from '../../../../../../../infrastructure/solutionFile';

/* codePost other imports  */
import { CodeWindow } from './utils/CodeWindow';

const { Sider, Content } = Layout;

interface IProps {
  assignment: AssignmentType;
  files: SolutionFileType[];
  addFile: (file: any) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
  updateFile: (id: number, newCode: string) => Promise<void>;
}

export const SolutionCode = (props: IProps) => {
  /******************************* State Variables ****************************/
  const [currentIndex, setIndex] = useState('0');

  /******************************** API Functions ****************************/
  const onSave = (newCode: string) => {
    return props.updateFile(props.files[parseInt(currentIndex, 10)].id, newCode);
  };

  /************************** State Change Functions ****************************/
  const changeIndex = (e: ClickParam) => {
    setIndex(e.key);
  };

  /***************************** Return ****************************************/
  return (
    <div>
      <Layout style={{ maxHeight: 450 }}>
        <Sider theme="light">
          {'Files'}
          <Menu selectedKeys={[currentIndex]} mode="inline" onClick={changeIndex}>
            {props.files.map((file, index) => {
              const pathName = `${file.path ? `${file.path}/` : ''}`;
              return (
                <Menu.Item key={index.toString()} style={{ height: 'fit-content', minHeight: 40 }}>
                  <div style={{ lineHeight: pathName ? 1.5 : 3, marginTop: 4 }}>
                    <div style={{ fontSize: 10, fontStyle: 'italic', whiteSpace: 'normal' }}>{pathName}</div>
                    <div>{file.name}</div>
                  </div>
                </Menu.Item>
              );
            })}
          </Menu>
          <CodeUploader files={props.files} addFile={props.addFile} deleteFile={props.deleteFile} />
        </Sider>
        <Content style={{ maxHeight: '70vh', overflow: 'auto', fontSize: 12 }}>
          {props.files.length === 0 ? (
            <div />
          ) : (
            <div style={{ position: 'relative', marginLeft: 5 }}>
              <CodeWindow
                code={props.files[parseInt(currentIndex, 10)].code}
                extension={props.files[parseInt(currentIndex, 10)].extension}
                onSave={onSave}
              />
            </div>
          )}
        </Content>
      </Layout>
    </div>
  );
};

interface IUploadProps {
  files: SolutionFileType[];
  addFile: (file: any) => Promise<void>;
  deleteFile: (id: number) => Promise<void>;
}

const CodeUploader = (props: IUploadProps) => {
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
      return props.addFile(newFile);
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
    let reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        const cleanedData = typeof reader.result === 'string' ? reader.result.replace(/\0/g, '') : reader.result;
        const extension = file.name.includes('.') ? file.name.split('.').slice(-1)[0] : '';
        setNewFiles([...newFiles, { uid: counter, code: cleanedData, name: file.name, extension: extension }]);
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
      <Button onClick={toggleVisible} style={{ marginTop: 20 }}>
        Add / Remove Files
      </Button>
      <Modal visible={visible} onCancel={toggleVisible} footer={null} width={750}>
        <Table columns={columns} dataSource={data} />
        <Upload
          beforeUpload={beforeUpload}
          multiple={true}
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
