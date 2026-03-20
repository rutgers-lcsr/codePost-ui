// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/* react imports */
import React, { useState } from 'react';

/* library imports */
import { Button, Modal, Select } from 'antd';

import { TestCategoryType } from '../../../../../../types/models';

interface IUploadProps {
  // Function to call on category choose
  onSelect: (id: number) => Promise<void>;
  categories: TestCategoryType[];
  childToRender: React.ReactElement;
  title: string;
  defaultCategory?: TestCategoryType;
}

export const CategorySelectModal = (props: IUploadProps) => {
  /******************************* State Variables ****************************/
  const [visible, setVisible] = useState(false);
  const [category, setCategory] = useState<number | undefined>(
    props.defaultCategory ? props.defaultCategory.id : undefined,
  );

  const toggleVisible = () => {
    setVisible(!visible);
  };

  // If the user has only created a single category, don't make them choose it
  // through a modal: select it automatically.
  React.useEffect(() => {
    if (visible) {
      if (props.categories.length === 1) {
        props.onSelect(props.categories[0].id);
        toggleVisible();
      }
    }
  }, [visible]);

  React.useEffect(() => {
    if (props.defaultCategory) {
      setCategory(props.defaultCategory.id);
    }
  }, [props.defaultCategory]);

  /******************************* API / State Change Functions ****************************/
  const onSave = async () => {
    if (category) {
      props.onSelect(category);
      toggleVisible();
    }
  };

  /******************************* State Change Functions ****************************/

  const onChange = (value: string) => {
    setCategory(parseInt(value, 10));
  };

  /******************************* Return *****************************************/
  return (
    <React.Fragment>
      {React.cloneElement(props.childToRender as React.ReactElement<Record<string, unknown>>, {
        onClick: toggleVisible,
      })}
      <Modal
        open={visible && props.categories.length > 1}
        title={props.title}
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
        <Select
          defaultValue={props.defaultCategory ? props.defaultCategory.name : undefined}
          onChange={onChange}
          style={{ width: '100%' }}
        >
          {props.categories.map((el) => (
            <Select.Option key={el.id} value={el.id}>
              {el.name}
            </Select.Option>
          ))}
        </Select>
      </Modal>
    </React.Fragment>
  );
};
