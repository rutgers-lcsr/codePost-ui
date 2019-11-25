/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Modal, Select, Icon, Tooltip } from 'antd';

import { TestCategoryType } from '../../../../../../infrastructure/testCategory';

interface IUploadProps {
  addTest: (id: number) => Promise<void>;
  categories: TestCategoryType[];
}

export const AddTestModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<number | undefined>(undefined);

  // If the user has only created a single category, don't make them choose it
  // through a modal: select it automatically.
  React.useEffect(() => {
    if (visible) {
      if (props.categories.length === 1) {
        props.addTest(props.categories[0].id);
        toggleVisible();
      }
    }
  }, [visible]);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    if (category) {
      props.addTest(category);
      toggleVisible();
    }
  };

  /******************************* State Change Functions ****************************/
  const toggleVisible = () => {
    setVisible(!visible);
  };

  const onChange = (value: string) => {
    setCategory(parseInt(value, 10));
  };

  /******************************* Return *****************************************/
  return (
    <span>
      <Tooltip title="Add File">
        <Icon type="file-add" onClick={toggleVisible} />
      </Tooltip>
      <Modal
        visible={visible && props.categories.length > 1}
        title={`Add TestCase`}
        onCancel={toggleVisible}
        width={400}
        footer={[
          <Button key="cancel" onClick={toggleVisible}>
            Cancel
          </Button>,
          <Button key="save" type="primary" onClick={onSave} disabled={!category}>
            Save
          </Button>,
        ]}
      >
        Category:{' '}
        <Select onChange={onChange} style={{ width: '100%' }}>
          {props.categories.map((el) => (
            <Select.Option key={el.id} value={el.id}>
              {el.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </span>
  );
};
