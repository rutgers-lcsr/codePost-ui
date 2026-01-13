import { Alert } from 'antd';

const TestsList = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        padding: '40px',
      }}
    >
      <Alert
        message="Tests coming soon"
        description="Test results and execution will be available here."
        type="info"
        showIcon
      />
    </div>
  );
};

export default TestsList;
