import * as React from 'react';

import { Modal } from 'antd';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, CartesianGrid, Tooltip, Legend } from 'recharts';

interface IResultsType {
  [id: number]: {
    passed: number;
    failed: number;
    error: number;
  };
}

const raw: IResultsType = {
  1: { passed: 10, failed: 5, error: 5 },
  2: { passed: 15, failed: 2, error: 3 },
};

interface IProps {
  raw: IResultsType;
}

// const data = [
//   {
//     AnswerRef: 'one',
//     Text: '5 out of 50 throws',
//     Score: 0,
//     RespondentPercentage: 12,
//     Rank: 1,
//   },
//   {
//     AnswerRef: 'two',
//     Text: '25 out of 50 throws',
//     Score: 0,
//     RespondentPercentage: 32,
//     Rank: 2,
//   },
//   {
//     AnswerRef: 'three',
//     Text: '30 out of 50 throws',
//     Score: 1,
//     RespondentPercentage: 41,
//     Rank: 3,
//   },
//   {
//     AnswerRef: 'four',
//     Text: 'None of the above',
//     Score: 0,
//     RespondentPercentage: 16,
//     Rank: 4,
//   },
// ];

const RunAllModal = (props: IProps) => {
  const data = Object.keys(props.raw).map((key) => {
    const obj: any = raw[parseInt(key, 10)];
    return {
      AnswerRef: key,
      Text: key,
      Score: obj.passed / (obj.passed + obj.failed + obj.error),
    };
  });
  return (
    <Modal visible={Object.keys(props.raw).length > 0} width={700} title="Results">
      <ResponsiveContainer width="95%" height={400}>
        <BarChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 25 }} layout="horizontal">
          <XAxis dataKey="Text" fontFamily="sans-serif" tickSize dy="25" />
          <YAxis hide />
          <CartesianGrid vertical={false} stroke="#ebf3f0" />
          <Bar dataKey="Score" barSize={170} fontFamily="sans-serif" label={'test'}>
            {data.map((entry, index) => (
              <Cell fill={data[index].AnswerRef === 'three' ? '#61bf93' : '#ededed'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      Submissions tested: 5/380
    </Modal>
  );
};

export default RunAllModal;
