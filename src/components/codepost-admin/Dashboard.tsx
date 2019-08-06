import * as React from 'react';

import { Typography } from 'antd';

import PeripheralPageLayout from '../core/layouts/PeripheralPageLayout';

const Dashboard = (props: any) => {
  return (
    <PeripheralPageLayout user={props.user} handleLogout={props.handleLogout} subtitle="SUPERADMIN DASHBOARD">
      <div>
        <Typography.Title level={2}>codePost Admin Dashboard</Typography.Title>
      </div>
    </PeripheralPageLayout>
  );
};

export default Dashboard;
