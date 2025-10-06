import { Link } from 'react-router-dom';

import { SettingOutlined } from '@ant-design/icons';

import { UserType } from '../../../infrastructure/user';

import RoleMenu from '../RoleMenu';

import CPButton from '../CPButton';
import CPFlex from '../CPFlex';
import CPTooltip from '../CPTooltip';

import layoutVars from '../../../styles/layout/_layoutVars';
import useWindowSize from '../useWindowSize';

import { tooltips } from '../../core/tooltips';

interface IProps {
  user: UserType;
  handleLogout: any;
  subtitle?: string;
}

const PeripheralPageHeader = (props: IProps) => {
  const windowSize = useWindowSize();
  const mobile = windowSize.width < layoutVars.breakpoints.mobile.peripheral;

  const logo = (
    <Link style={{ fontSize: 34, color: 'black', paddingLeft: 10 }} className="link--header" to={'/'}>
      code<b>Post</b>
    </Link>
  );

  const subtitle = props.subtitle !== undefined ? props.subtitle : null;

  // Remove email on mobile to make header fit
  const email = mobile ? (
    <div />
  ) : (
    <span key="header-user" className="cp-label cp-label--bold">
      {props.user.email}
    </span>
  );

  const logout = (
    <CPButton key="header-logout" cpType="secondary" onClick={props.handleLogout}>
      Log Out
    </CPButton>
  );

  const headerRight = [
    email,
    <RoleMenu key="header-role-menu" user={props.user} theme="light" />,
    <CPTooltip key="settings" title={tooltips.management.header.settings} hideThisOnHideTips={true}>
      <Link className="internal-link" to="/settings">
        <SettingOutlined />
      </Link>
    </CPTooltip>,
    logout,
  ];

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <CPFlex
        left={[logo, subtitle]}
        right={headerRight}
        gutterSize={20}
        style={{ maxWidth: 1050, padding: '30px 10px', width: '100%' }}
      />
    </div>
  );
};

export default PeripheralPageHeader;
