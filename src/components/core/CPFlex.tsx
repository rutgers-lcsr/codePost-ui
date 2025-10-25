import { CSSProperties, ReactNode } from 'react';

interface ICPFlexProps {
  left: ReactNode[];
  right: ReactNode[];
  middle?: ReactNode[];
  gutterSize: number;
  style?: CSSProperties;
  className?: string;
}

const CPFlex: React.FC<ICPFlexProps> = (props) => {
  const leftNodes = props.left.map((node: ReactNode, index: number) => {
    return (
      <div key={`left-${index}`} style={{ marginRight: `${props.gutterSize}px` }}>
        {node}
      </div>
    );
  });

  const rightNodes = props.right.map((node: ReactNode, index: number) => {
    return (
      <div key={`right-${index}`} style={{ marginLeft: `${props.gutterSize}px` }}>
        {node}
      </div>
    );
  });

  let middleNodes;
  if (props.middle !== undefined) {
    middleNodes = props.middle.map((node: ReactNode, index: number) => {
      return <div key={`middle-${index}`}>{node}</div>;
    });
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', ...props.style }} className={props.className}>
      <div style={{ display: 'flex', alignItems: 'center' }}>{leftNodes}</div>
      <div style={{ margin: '0 auto', alignItems: 'center', display: 'flex' }}>{middleNodes}</div>
      <div style={{ display: 'flex', alignItems: 'center' }}>{rightNodes}</div>
    </div>
  );
};

export default CPFlex;
