import * as React from 'react';
import { Link } from 'react-router-dom';
// import '../styles/index.scss';

interface IProps {
  email: string;
  handleLogout: (event: any) => void;
}

class TopBar extends React.Component<IProps, {}> {
  public render() {
    return (
      <div className="topbar">
        <div className="topbar-logo">
          <Link to="/">
            code<span className="codePost-P">P</span>ost
          </Link>
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
