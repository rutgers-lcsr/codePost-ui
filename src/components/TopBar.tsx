import * as React from 'react';
import '../styles/index.scss';

interface IProps {
  email: string,
  handleLogout: (event: any) => void,
}

class TopBar extends React.Component<IProps, {}> {
  public render() {
    return (
      <div className='topbar'>
        <div className="topbar-logo">
          code<span className="codePost-P">P</span>ost
          <div className="welcome">
            Hello, {this.props.email}
            <button onClick={this.props.handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    );
  }

}

export default TopBar;