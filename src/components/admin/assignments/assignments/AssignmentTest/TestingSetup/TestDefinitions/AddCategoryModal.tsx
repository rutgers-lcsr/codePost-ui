/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Input, Modal, Row, Switch, Icon } from 'antd';

interface IUploadProps {
  addCategory: (name: string, proMode: boolean) => Promise<void>;
  externalOnly: boolean;
  icon?: boolean;
}

export const AddCategoryModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [proMode, setProMode] = useState(false);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    await props.addCategory(name, proMode);
    setName('');
    setVisible(!visible);
  };

  /******************************* State Change Functions ****************************/
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const onChange = (e: any) => {
    setName(e.target.value);
  };

  /******************************* Return *****************************************/
  return (
    <span>
      {props.icon ? (
        <Icon type="folder-add" onClick={toggleVisible} />
      ) : (
        <Button onClick={toggleVisible}>Add Test Category</Button>
      )}

      <Modal
        visible={visible}
        title="Add new test category"
        onCancel={toggleVisible}
        onOk={onSave}
        width={400}
        style={{ padding: 25 }}
      >
        <Input onChange={onChange} value={name} placeholder="Category Name" />
      </Modal>
    </span>
  );
};
