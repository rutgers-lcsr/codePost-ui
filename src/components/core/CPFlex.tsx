import * as React from 'react';

interface ICPFlexProps {
  left: React.ReactNode[];
  right: React.ReactNode[];
  middle?: React.ReactNode[];
  gutterSize: number;
  style?: React.CSSProperties;
}

class CPFlex extends React.Component<ICPFlexProps, {}> {
  public render() {
    const leftNodes = this.props.left.map((node: React.ReactNode, index: number) => {
      return (
        <div key={`left-${index}`} className="left" style={{ marginRight: `${this.props.gutterSize}px` }}>
          {node}
        </div>
      );
    });

    const rightNodes = this.props.right.map((node: React.ReactNode, index: number) => {
      return (
        <div key={`right-${index}`} className="right" style={{ marginLeft: `${this.props.gutterSize}px` }}>
          {node}
        </div>
      );
    });

    let middleNodes;
    if (this.props.middle !== undefined) {
      middleNodes = this.props.middle.map((node: React.ReactNode, index: number) => {
        return (
          <div key={`middle-${index}`} className="middle" style={{ display: 'inline-block' }}>
            {node}
          </div>
        );
      });
    }

    return (
      <div className="cp-flex" style={this.props.style ? this.props.style : {}}>
        {leftNodes}
        <div className="gap" style={{ marginLeft: `-${this.props.gutterSize}px` }} />
        <div style={{ flex: 'auto', verticalAlign: 'middle' }}>{middleNodes}</div>
        {rightNodes}
      </div>
    );
  }
}

export default CPFlex;
