// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Spin } from 'antd';

const Loading = ({ text }: { text?: string }) => {
  return (
    <div style={{ width: '100%', textAlign: 'center', paddingTop: '80px' }}>
      <Spin />
      {text && <div style={{ marginTop: 12 }}>{text}</div>}
    </div>
  );
};

export default Loading;
