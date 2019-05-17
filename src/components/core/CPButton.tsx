import * as React from 'react';

import { Button } from 'antd';

class CPButton extends React.Component<any, {}> {
  public render() {
    console.log(this.props.windowWidth);
    return (
      <Button className={'cpbutton'} {...this.props}>
        {this.props.children}
      </Button>
    );
  }
}

export default CPButton;
