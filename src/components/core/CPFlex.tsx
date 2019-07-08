import * as React from 'react';

interface ICPFlexProps {
  left: React.ReactNode[];
  right: React.ReactNode[];
  gutterSize: number;
  style?: React.CSSProperties;
}

class CPFlex extends React.Component<ICPFlexProps, {}> {
  public render() {
    const leftNodes = this.props.left.map((node: React.ReactNode, index: number) => {
      return (
        <div key={`left-${index}`} style={{ marginRight: `${this.props.gutterSize}px` }}>
          {node}
        </div>
      );
    });

    const rightNodes = this.props.right.map((node: React.ReactNode, index: number) => {
      return (
        <div key={`right-${index}`} style={{ marginLeft: `${this.props.gutterSize}px` }}>
          {node}
        </div>
      );
    });

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', ...this.props.style }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>{leftNodes}</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>{rightNodes}</div>
      </div>
    );
  }
}

export default CPFlex;
