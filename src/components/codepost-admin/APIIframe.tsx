// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
