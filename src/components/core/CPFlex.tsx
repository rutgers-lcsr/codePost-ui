import { CSSProperties, Component, ReactNode } from 'react';

interface ICPFlexProps {
  left: ReactNode[];
  right: ReactNode[];
  middle?: ReactNode[];
  gutterSize: number;
  style?: CSSProperties;
  className?: string;
}

class CPFlex extends Component<ICPFlexProps> {
  public render() {
    const leftNodes = this.props.left.map((node: ReactNode, index: number) => {
      return (
        <div key={`left-${index}`} style={{ marginRight: `${this.props.gutterSize}px` }}>
          {node}
        </div>
      );
    });

    const rightNodes = this.props.right.map((node: ReactNode, index: number) => {
      return (
        <div key={`right-${index}`} style={{ marginLeft: `${this.props.gutterSize}px` }}>
          {node}
        </div>
      );
    });

    let middleNodes;
    if (this.props.middle !== undefined) {
      middleNodes = this.props.middle.map((node: ReactNode, index: number) => {
        return <div key={`middle-${index}`}>{node}</div>;
      });
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', ...this.props.style }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>{leftNodes}</div>
        <div style={{ margin: '0 auto', alignItems: 'center', display: 'flex' }}>{middleNodes}</div>
        <div style={{ display: 'flex', alignItems: 'center' }}>{rightNodes}</div>
      </div>
    );
  }
}

export default CPFlex;
