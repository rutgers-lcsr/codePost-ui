/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Input, Modal, Icon, Tooltip } from 'antd';

import { TestCategoryType } from '../../../../../../infrastructure/types';

interface IUploadProps {
  addCategory: (name: string, proMode: boolean) => Promise<TestCategoryType>;
  externalOnly: boolean;
  icon?: boolean;
  textLink?: string;
}

export const AddCategoryModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    await props.addCategory(name, false);
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

  React.useEffect(() => {
    const handleKeydown = (e: any) => {
      if (visible && e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        onSave();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  /******************************* Return *****************************************/
  return (
    <span>
      {props.textLink ? (
        <a onClick={toggleVisible}>{props.textLink}</a>
      ) : props.icon ? (
        <Tooltip title="Add Category">
          <Icon type="folder-add" onClick={toggleVisible} />
        </Tooltip>
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
