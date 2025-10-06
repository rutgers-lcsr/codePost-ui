import { Spin } from 'antd';

const Loading = () => {
  return (
    <div style={{ width: '100%', textAlign: 'center', paddingTop: '80px' }}>
      <Spin />
    </div>
  );
};

export default Loading;
