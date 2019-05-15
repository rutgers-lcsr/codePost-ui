import * as React from 'react';

import * as colors from '../styles/abstracts/_colors.scss';

import { Table } from 'antd';

const colorSwatch = (colorName: string) => (
  <div
    style={{
      backgroundColor: colorName,
      borderRadius: '8px',
      height: '32px',
      width: '120px',
    }}
  />
);

const createColorGroup = (prefix: string, title: string): [any, any] => {
  const keys = Object.keys(colors).filter((name: string) => {
    return name.includes(prefix);
  });

  const columns = [
    {
      title,
      dataIndex: 'token',
      width: '30%',
    },
    {
      title: '',
      dataIndex: 'value',
      width: '30%',
    },
    {
      title: '',
      dataIndex: 'example',
    },
  ];

  const data = keys.map((name: string, index: number) => {
    return {
      key: index,
      token: `$${name}`,
      value: colors[name],
      example: colorSwatch(colors[name]),
    };
  });

  return [columns, data];
};

const Colors = () => {
  const [brandColumns, brandData] = createColorGroup('brand', 'Brand Colors');
  const [actionColumns, actionData] = createColorGroup('action', 'Action Colors');
  const [neutralColumns, neutralData] = createColorGroup('neutral', 'Neutral Colors');
  const [greenColumns, greenData] = createColorGroup('green', 'Green Palette');

  return (
    <div>
      <Table columns={brandColumns} dataSource={brandData} pagination={false} />
      <Table columns={actionColumns} dataSource={actionData} pagination={false} />
      <Table columns={neutralColumns} dataSource={neutralData} pagination={false} />
      <Table columns={greenColumns} dataSource={greenData} pagination={false} />
      <br />
    </div>
  );
};

export default Colors;
