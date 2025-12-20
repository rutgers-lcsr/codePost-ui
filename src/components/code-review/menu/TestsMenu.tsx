import { Alert } from 'antd';

const TestsMenu = () => {
  return (
    <div
      id="tests-info"
      style={{
        paddingLeft: '15px',
        paddingBottom: '10px',
        paddingRight: '15px',
        paddingTop: '10px',
      }}
    >
      <Alert title="Tests coming soon" type="info" showIcon />
    </div>
  );
};

export default TestsMenu;
