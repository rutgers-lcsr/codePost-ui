import * as React from 'react';

import codepostIcon from './../../img/codepost_icon.png';

export type CPLogoType = 'main' | 'icon' | 'dark';

interface ICPLogoProps {
  cpType: CPLogoType;
  onClick?: () => void;
}

class CPLogo extends React.Component<ICPLogoProps, {}> {
  public render() {
    const addendum = null;
    if (this.props.cpType === 'main') {
      return (
        <div className="cp-logo" onClick={this.props.onClick}>
          code<span className="cp-logo__highlight">Post{addendum}</span>
        </div>
      );
    } else if (this.props.cpType === 'dark') {
      return (
        <div className="cp-logo" onClick={this.props.onClick} style={{ color: 'black' }}>
          code<span className="cp-logo__highlight">Post{addendum}</span>
        </div>
      );
    } else {
      return (
        <div className="cp-logo" onClick={this.props.onClick}>
          <img src={codepostIcon} style={{ width: '24px' }} alt="" />
        </div>
      );
    }
  }
}

export default CPLogo;
