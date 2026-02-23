// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Tag } from 'antd';

import CPTooltip from '../../../../../core/CPTooltip';

import { FILE_TYPE } from './FileType';

interface IProps {
  type: FILE_TYPE;
  small: boolean;
}

const FileTag = (props: IProps) => {
  let name;
  let abbrev;
  let color;
  switch (props.type) {
    case FILE_TYPE.SUBMISSION:
      name = 'Submission File';
      abbrev = 'S';
      color = 'volcano';
      break;
    case FILE_TYPE.MAIN:
      name = 'Main';
      abbrev = 'M';
      color = 'grey';
      break;
    case FILE_TYPE.CODEPOST_TEST_FILE:
      name = 'codePost generated testfile';
      abbrev = 'CT';
      color = 'green';
      break;
  }

  const tag = (
    <Tag
      color={color}
      style={{
        padding: '0px 5px',
        width: props.small ? '28px' : undefined,
        textAlign: props.small ? 'center' : undefined,
      }}
    >
      {props.small ? abbrev : name}
    </Tag>
  );

  if (props.small) {
    return <CPTooltip title={name}>{tag}</CPTooltip>;
  }
  return tag;
};

export default FileTag;
