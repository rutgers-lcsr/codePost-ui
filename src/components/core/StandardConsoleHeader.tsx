import * as React from 'react';

import CPButton from './CPButton';
import CPFlex from './CPFlex';
import CPLogo from './CPLogo';

interface IStandardConsoleHeaderProps {
  email: string;
  handleLogout: any;
}

const StandardConsoleHeader = (props: IStandardConsoleHeaderProps) => {
  const headerLeft = [<CPLogo key="header-0" cpType="main" />];

  const headerRight = [
    <span key="header-user" className="cp-label cp-label--white cp-label--bold">
      {props.email}
    </span>,
    <CPButton key="header-logout" cpType="dark" onClick={props.handleLogout}>
      Log Out
    </CPButton>,
  ];

  return <CPFlex left={headerLeft} right={headerRight} gutterSize={20} />;
};

export default StandardConsoleHeader;
