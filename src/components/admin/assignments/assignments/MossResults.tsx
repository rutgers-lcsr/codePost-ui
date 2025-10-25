/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* React imports */

import { Link } from 'react-router-dom';

import { CodeOutlined } from '@ant-design/icons';

import { Card, Empty } from 'antd';

import { TableDetail } from '../../other/TableDetail';

interface IMossResultFile {
  sub_id: string;
  email: string;
  similarity: string;
}

export interface IMossResult {
  matchURL: string;
  file1: IMossResultFile;
  file2: IMossResultFile;
  linesMatched: string;
}

interface IProps {
  results: IMossResult[];
}

const MossResults = (props: IProps) => {
  const aligner: 'left' | 'center' | 'right' = 'center';
  const columns = [
    {
      title: 'Inspect',
      dataIndex: 'inspect',
      key: 'inspect',
      align: aligner,
      render: (url: string) => {
        return (
          <a href={url} target="_blank" rel="noopener noreferrer">
            Inspect
          </a>
        );
      },
    },
    {
      title: 'Open',
      dataIndex: 'open1',
      key: 'open1',
      align: aligner,
      render: (open1: string) => {
        return (
          <Link to={`/code/${open1}`} target="_blank" rel="noopener noreferrer">
            <CodeOutlined />
          </Link>
        );
      },
    },
    {
      title: 'Submission1',
      dataIndex: 'submission1',
      key: 'submission1',
    },
    {
      title: 'Open',
      dataIndex: 'open2',
      key: 'open2',
      align: aligner,
      render: (open2: string) => {
        return (
          <Link to={`/code/${open2}`} target="_blank" rel="noopener noreferrer">
            <CodeOutlined />
          </Link>
        );
      },
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
      align: aligner,
      defaultSortOrder: 'descend' as 'ascend' | 'descend',
      sorter: (a: any, b: any) => a.similarity - b.similarity,
    },
    {
      title: 'Lines Matched',
      dataIndex: 'linesMatched',
      key: 'linesMatched',
      align: aligner,
      sorter: (a: any, b: any) => a.linesMatched - b.linesMatched,
    },
  ];

  const data = props.results.map((result: any, index: number) => {
    return {
      key: index,
      inspect: result.matchURL,
      open1: result.file1.sub_id,
      open2: result.file2.sub_id,
      submission1: result.file1.email,
      submission2: result.file2.email,
      similarity: +result.file1.similarity,
      linesMatched: +result.linesMatched,
    };
  });

  const table = (
    <TableDetail
      loadComplete={true}
      title={'Results'}
      isEmpty={false}
      emptyNode={
        <Empty
          styles={{
            image: {
              height: 60,
            },
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
      style={{ boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 15px 0px', padding: '0px', margin: '15px', border: '0px' }}
      className="moss-results"
    >
      {table}
    </Card>
  );
};

export default MossResults;
