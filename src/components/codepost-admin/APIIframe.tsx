const APIIframe = () => {
  return (
    <iframe
      src={`${process.env.REACT_APP_API_URL}/`}
      title="API Documentation"
      style={{ width: '100%', height: '100%', border: 'none' }}
    />
  );
};

export default APIIframe;
