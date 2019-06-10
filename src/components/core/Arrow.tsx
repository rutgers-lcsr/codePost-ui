import * as React from 'react';

import { Row } from 'antd';

type ArrowDirection = 'left' | 'right';
type ArrowColor = 'grey' | 'green';

interface IProps {
  direction: ArrowDirection;
  text: string | undefined;
  color: ArrowColor;
}

class Arrow extends React.PureComponent<IProps, {}> {
  public render() {
    const { direction, text, color } = this.props;
    const imgSrc =
      color === 'green'
        ? require('../../img/get-started-arrow-left.png')
        : require('../../img/get-started-arrow-left-2.png');
    switch (direction) {
      case 'left':
        return (
          <Row align="middle" type="flex" justify="start">
            <img src={imgSrc} style={{ paddingRight: 15 }} />
            <div style={{ fontSize: 28, fontWeight: 325 }}>{text}</div>
          </Row>
        );
      case 'right':
        return (
          <Row align="middle" type="flex" justify="end">
            <div style={{ fontSize: 28, fontWeight: 325 }}>{text}</div>
            <img src={imgSrc} style={{ paddingLeft: 15 }} />
          </Row>
        );
    }
  }
}

export default Arrow;
