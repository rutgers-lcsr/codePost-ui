import * as React from 'react';

import { Card, Statistic } from 'antd';

import { CourseType, RosterType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';

interface ISummaryCardProps {
  title: string;
  objects: OrganizationType[] | CourseType[] | RosterType[];
  onClick: any;
}

const SummaryCard = (props: ISummaryCardProps) => {
  const onClick = () => {
    props.onClick(props.title);
  };
  return (
    <Card title={props.title} bordered={false} style={{ width: 300, cursor: 'pointer' }} onClick={onClick}>
      <Statistic title="Total" value={props.objects.length} />
    </Card>
  );
};

export default SummaryCard;
