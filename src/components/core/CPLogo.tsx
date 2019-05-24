import * as React from 'react';

export type CPLogoType = 'main' | 'icon';

interface ICPLogoProps {
  cpType: CPLogoType;
  onClick?: () => void;
}

class CPLogo extends React.Component<ICPLogoProps, {}> {
  public render() {
    if (this.props.cpType === 'main') {
      return (
        <div className="cp-logo" onClick={this.props.onClick}>
          code<span className="cp-logo__highlight">Post</span>
        </div>
      );
    } else {
      return (
        <div className="cp-logo" onClick={this.props.onClick}>
          <span className="cp-logo__highlight">cP</span>
        </div>
      );
    }
  }
}

export default CPLogo;
