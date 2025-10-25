/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Input, Modal } from 'antd';

interface BasicItem {
  id: number;
  name: string;
}

interface IUploadProps {
  updateItem?: (id: number, name: string) => Promise<void>;
  deleteItem: (id: number) => Promise<void>;
  item: BasicItem;
}

export const EditObjectModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState(props.item.name);
  const [loading, setLoading] = useState(false);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    if (props.updateItem) {
      setLoading(true);
      await props.updateItem(props.item.id, name);
      setVisible(!visible);
      setName('');
      setLoading(false);
    }
  };

  /******************************* State Change Functions ****************************/
  const toggleVisible = (_e: any) => {
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
      <span onClick={toggleVisible}>Rename</span>
      <Modal
        open={visible}
        title={`Edit: ${props.item.name}`}
        onCancel={toggleVisible}
        width={400}
        footer={[
          <Button key="cancel" onClick={toggleVisible}>
            Cancel
          </Button>,
          <Button key="save" type="primary" loading={loading} disabled={!props.updateItem} onClick={onSave}>
            Save
          </Button>,
        ]}
      >
        <Input onChange={onChange} value={name} disabled={!props.updateItem} placeholder="Category Name" />
      </Modal>
    </span>
  );
};
