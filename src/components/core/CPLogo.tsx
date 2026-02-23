// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { theme } from 'antd';
import codepostIcon from './../../img/codepost_icon.png';

export type CPLogoType = 'main' | 'icon' | 'dark';

interface ICPLogoProps {
  cpType: CPLogoType;
  onClick?: () => void;
}

const CPLogo = ({ cpType, onClick }: ICPLogoProps) => {
  const { token } = theme.useToken();
  const addendum = null;

  if (cpType === 'main') {
    return (
      <div className="cp-logo" onClick={onClick}>
        code<span className="cp-logo__highlight">Post{addendum}</span>
      </div>
    );
  }

  if (cpType === 'dark') {
    return (
      <div className="cp-logo" onClick={onClick} style={{ color: token.colorText }}>
        code<span className="cp-logo__highlight">Post{addendum}</span>
      </div>
    );
  }

  return (
    <div className="cp-logo" onClick={onClick}>
      <img src={codepostIcon} style={{ width: '24px' }} alt="" />
    </div>
  );
};

export default CPLogo;
