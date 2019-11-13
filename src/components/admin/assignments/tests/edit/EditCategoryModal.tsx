/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Input, Modal, Icon } from 'antd';

import { TestCategoryType } from '../../../../../infrastructure/testCategory';

interface IUploadProps {
  updateCategory: (obj: TestCategoryType) => Promise<void>;
  deleteCategory: (obj: TestCategoryType) => Promise<void>;
  testCategory: TestCategoryType;
  externalOnly: boolean;
}

export const EditCategoryModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(props.testCategory.name);
  const [loading, setLoading] = useState(false);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    setLoading(true);
    const newCategory = { ...props.testCategory };
    newCategory.name = name;
    await props.updateCategory(newCategory);
    setVisible(!visible);
    setName('');
    setLoading(false);
  };

  const onDelete = async () => {
    setLoading(true);
    await props.deleteCategory(props.testCategory);
    setVisible(!visible);
    setName('');
    setLoading(false);
  };

  /******************************* State Change Functions ****************************/
  const toggleVisible = (e: any) => {
    e.stopPropagation();
    setVisible(!visible);
  };

  const onChange = (e: any) => {
    setName(e.target.value);
  };

  /******************************* Return *****************************************/
  return (
    <span>
      <Icon type="edit" onClick={toggleVisible} />
      <Modal
        visible={visible}
        title={`Edit: ${props.testCategory.name}`}
        onCancel={toggleVisible}
        width={400}
        footer={[
          <Button key="cancel" onClick={toggleVisible}>
            Cancel
          </Button>,
          <Button key="delete" type="danger" loading={loading} onClick={onDelete}>
            Delete
          </Button>,
          <Button key="save" type="primary" loading={loading} onClick={onSave}>
            Save
          </Button>,
        ]}
      >
        <Input onChange={onChange} value={name} placeholder="Category Name" />
      </Modal>
    </span>
  );
};
