/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* other library imports */
import { withRouter } from 'react-router-dom';

/**********************************************************************************************************************/

interface IProps {
  location: any;
}

class ScrollToTop extends React.Component<IProps, {}> {
  public componentDidUpdate(prevProps: IProps) {
    console.log(this.props.location.pathname);
    console.log(prevProps.location.pathname);
    if (this.props.location.pathname !== prevProps.location.pathname) {
      window.scrollTo(0, 0);
    }
  }

  public render() {
    console.log('bump!');
    return this.props.children;
  }
}

export default withRouter(ScrollToTop);
