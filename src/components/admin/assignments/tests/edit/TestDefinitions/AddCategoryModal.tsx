// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Input, Modal } from 'antd';

import { TestCategoryType } from '../../../../../../types/models';

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
    <React.Fragment>
      {props.textLink ? (
        <a onClick={toggleVisible}>{props.textLink}</a>
      ) : props.icon ? (
        <Button onClick={toggleVisible} style={{ height: 28, fontSize: 12, padding: '0px 9px' }}>
          Add category
        </Button>
      ) : (
        <Button onClick={toggleVisible}>Add category</Button>
      )}

      <Modal
        open={visible}
        title="Create new test category"
        onCancel={toggleVisible}
        onOk={onSave}
        width={400}
        style={{ padding: 25 }}
      >
        <Input onChange={onChange} value={name} placeholder="Category name" />
      </Modal>
    </React.Fragment>
  );
};
