import { LogoutOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';

import CPButton from '../CPButton';
import CPFlex from '../CPFlex';
import CPLogo from '../CPLogo';

import type { UserType } from '../../../types/models';

import { USER_TYPE } from '../../../types/common';
import RoleMenu from '../RoleMenu';

import ThemeToggle from '../ThemeToggle';

interface IStandardConsoleHeaderProps {
  user: UserType;
  handleLogout: any;
  thisApp?: USER_TYPE;
}

const StandardConsoleHeader = (props: IStandardConsoleHeaderProps) => {
  const openHome = () => {
    if (localStorage.getItem('source') === 'codePost') {
      window.open('https://codepost.cs.rutgers.edu', '_blank');
    }
  };

  const headerLeft = [
    <Link key="header-0" to="/">
      <CPLogo cpType="main" onClick={openHome} />
    </Link>,
  ];

  const logout = (
    <CPButton key="header-logout" cpType="dark" fallbackIcon={<LogoutOutlined />} onClick={props.handleLogout}>
      Log Out
    </CPButton>
  );

  const headerRight = [
    <ThemeToggle key="theme-toggle" />,
    <span key="header-user" className="cp-label cp-label--white cp-label--bold">
      {props.user.email}
    </span>,
    <RoleMenu key="header-roles" user={props.user} theme="dark" />,
    logout,
  ];

  return <CPFlex left={headerLeft} right={headerRight} gutterSize={20} />;
};

export default StandardConsoleHeader;
