import CPButton from '../CPButton';
import CPFlex from '../CPFlex';

import { SettingOutlined } from '@ant-design/icons';

interface IStandardManagementHeaderProps {
  email: string;
  handleLogout: any;
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
