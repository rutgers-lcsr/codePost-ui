/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */
import * as React from 'react';

import { Card, Empty } from 'antd';

import { TableDetail } from '../../other/TableDetail';

const MossResults = (props: any) => {
  const aligner: 'left' | 'center' | 'right' = 'center';
  const columns = [
    { title: 'Inspect', dataIndex: 'inspect', key: 'inspect', align: aligner },
    { title: 'Open', dataIndex: 'open1', key: 'open1', align: aligner },
    {
      title: 'Submission1',
      dataIndex: 'submission1',
      key: 'submission1',
    },
    {
      title: 'Submission2',
      dataIndex: 'submission2',
      key: 'submission2',
    },
    {
      title: 'Similarity',
      dataIndex: 'similarity',
      key: 'similarity',
    },
    {
      title: 'Lines Matched',
      dataIndex: 'linesMatched',
      key: 'linesMatched',
    },
  ];

  const data = [
    {
      key: '1',
      inspect: 'inspect',
      open1: 'open',
      submission1: 'submission1',
      submission2: 'submission2',
      similarity: 20,
      linesMatched: 10,
    },
    {
      key: '2',
      inspect: 'inspect',
      open1: 'open',
      submission1: 'submission1',
      submission2: 'submission2',
      similarity: 20,
      linesMatched: 10,
    },
    {
      key: '3',
      inspect: 'inspect',
      open1: 'open',
      submission1: 'submission1',
      submission2: 'submission2',
      similarity: 20,
      linesMatched: 10,
    },
  ];

  const table = (
    <TableDetail
      loadComplete={true}
      title={'Results'}
      isEmpty={false}
      emptyNode={
        <Empty
          imageStyle={{
            height: 60,
          }}
          description={'nothing returned'}
        >
          try again
        </Empty>
      }
      columns={columns}
      data={data}
      actions={[]}
      breadcrumbs={null}
      titleInfo={'Moss results'}
    />
  );
  return (
    <Card
      style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 15px 0px', padding: '10px', margin: '15px', border: '0px' }}
      className="moss-results"
    >
      {table}
    </Card>
  );
};

export default MossResults;
