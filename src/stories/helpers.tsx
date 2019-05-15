import * as React from 'react';

import { Typography } from 'antd';

const { Title } = Typography;

interface IStorybookContainerProps {
  title: string;
  children: React.ReactNode;
}

export const StorybookContainer = (props: IStorybookContainerProps) => {
  return (
    <div {...props} style={{ margin: '20px' }}>
      <Typography>
        <Title>{props.title}</Title>
        {props.children}
      </Typography>
    </div>
  );
};
