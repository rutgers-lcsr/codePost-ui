import * as React from 'react';

import CPButton from '../CPButton';
import CPFlex from '../CPFlex';

interface IStandardManagementHeaderProps {
  email: string;
  handleLogout: any;
}

const StandardManagementHeader = (props: IStandardManagementHeaderProps) => {
  const headerRight = [
    <span key="header-user" className="cp-label cp-label--bold">
      {props.email}
    </span>,
    <CPButton key="header-settings" cpType="secondary" icon="setting" size="small" href="/settings" />,
    <CPButton key="header-logout" cpType="secondary" onClick={props.handleLogout}>
      Log Out
    </CPButton>,
  ];

  return <CPFlex left={[]} right={headerRight} gutterSize={10} />;
};

export default StandardManagementHeader;
