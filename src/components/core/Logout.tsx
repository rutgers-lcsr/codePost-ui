/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { Navigate } from 'react-router-dom';

/**********************************************************************************************************************/

interface IProps {
  handleLogout: () => void;
}

class Logout extends React.Component<IProps> {
  public render() {
    this.props.handleLogout();

    return <Navigate to="/" replace />;
  }
}

export default Logout;
