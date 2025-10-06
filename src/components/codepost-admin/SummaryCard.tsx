import { Card, Statistic } from 'antd';

import { CourseType, RosterType } from '../../infrastructure/course';
import { OrganizationType } from '../../infrastructure/organization';
import { AdminData } from './Dashboard';

interface ISummaryCardProps {
  title: string;
  objects: OrganizationType[] | CourseType[] | RosterType[] | AdminData[];
  onClick: any;
}

const SummaryCard = (props: ISummaryCardProps) => {
  const onClick = () => {
    props.onClick(props.title);
  };
  return (
    <Card
      title={props.title}
      variant="outlined"
      style={{ width: 300, marginBottom: '20px', cursor: 'pointer' }}
      onClick={onClick}
      hoverable={true}
    >
      <Statistic title="Total" value={props.objects.length} />
    </Card>
  );
};

export default SummaryCard;
