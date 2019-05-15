import * as React from 'react';

import { Button } from 'antd';

class CPButton extends React.Component<{}, {}> {
  public render() {
    return (
      <Button className={'cpbutton'} type="primary" {...this.props}>
        {this.props.children}
      </Button>
    );
  }
}

export default CPButton;
