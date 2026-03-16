// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import CPButton from '../CPButton';
import CPFlex from '../CPFlex';

import { SettingOutlined } from '@ant-design/icons';

interface IStandardManagementHeaderProps {
  email: string;
  handleLogout: () => void;
}

const StandardManagementHeader = (props: IStandardManagementHeaderProps) => {
  const logout = (
    <CPButton key="header-logout" cpType="secondary" onClick={props.handleLogout}>
      Log Out
    </CPButton>
  );
  const headerRight = [
    <span key="header-user" className="cp-label cp-label--bold">
      {props.email}
    </span>,
    <CPButton key="header-settings" cpType="secondary" icon={<SettingOutlined />} size="small" href="/settings" />,
    logout,
  ];

  return <CPFlex left={[]} right={headerRight} gutterSize={10} />;
};

export default StandardManagementHeader;
