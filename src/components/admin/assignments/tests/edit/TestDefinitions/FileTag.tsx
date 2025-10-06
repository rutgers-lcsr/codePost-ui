import { Tag } from 'antd';

import CPTooltip from '../../../../../core/CPTooltip';

import { FILE_TYPE } from '../TestingSetup';

interface IProps {
  type: FILE_TYPE;
  small: boolean;
}

const FileTag = (props: IProps) => {
  let name;
  let abbrev;
  let color;
  switch (props.type) {
    case FILE_TYPE.HELPER:
      name = 'Helper file';
      abbrev = 'H';
      color = 'purple';
      break;
    case FILE_TYPE.SOLUTION:
      name = 'Solution File';
      abbrev = 'S';
      color = 'orange';
      break;
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
    case FILE_TYPE.SOURCEFILE:
      name = 'User generated testfile';
      abbrev = 'UT';
      color = 'lime';
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
