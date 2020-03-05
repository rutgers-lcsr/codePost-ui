import * as React from 'react';

import SplitPane from 'react-split-pane';

const PseudoIDE = (props: any) => {
  return (
    <div style={{ border: '2px solid blue', height: '400px' }} className="pseudo-ide">
      <SplitPane split="vertical" defaultSize="33%">
        <div>pane 1 size: 33%</div>
        <SplitPane split="vertical" defaultSize="50%">
          <div>pane 2 size: 50% (of remaining space)</div>
          <div>pane 3</div>
        </SplitPane>
      </SplitPane>
    </div>
  );
};

export default PseudoIDE;
