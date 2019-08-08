import * as React from 'react';

const overlayStyle: React.CSSProperties = {
  height: '100%',
  background: 'rgba(0,0,10,.65)',
  position: 'absolute',
  top: '0',
  left: '0',
  justifyContent: 'center',
  alignItems: 'center',
  transition: '0.8s',
  width: '100%',
};

const titleStyle: React.CSSProperties = {
  color: 'hsla(0,0%,100%,.9)',
  fontWeight: 600,
  fontSize: '22px',
  marginTop: '-40px',
  textAlign: 'center',
};

const subTitleStyle: React.CSSProperties = {
  color: 'hsla(0,0%,100%,.65)',
  fontWeight: 500,
  marginBottom: '20px',
  fontSize: '16px',
  textAlign: 'center',
};

const playButtonStyle: React.CSSProperties = {
  width: '100px',
  height: '100px',
  background: 'linear-gradient(135deg,#fff,#f2f2f2)',
  borderRadius: '50px',
  margin: '0 auto',
  transition: '.15s',
  border: '7px solid rgba(63,141,232,0)',
  display: 'grid',
  alignItems: 'center',
  textAlign: 'center',
  cursor: 'pointer',
};

const arrowStyle: React.CSSProperties = {
  fill: '#24be85',
  width: '35%',
  margin: '0 auto',
  cursor: 'pointer',
};

const LandingVideo = () => {
  const [wasClicked, setWasClicked] = React.useState(false);

  return (
    <div style={{ position: 'relative' }} onClick={setWasClicked.bind(false, true)}>
      <div className="video-overlay" style={{ ...overlayStyle, display: wasClicked ? 'none' : 'flex' }}>
        <div className="overlay-content-wrapper">
          <div className="video-title" style={titleStyle}>
            How codePost works
          </div>
          <div className="video-subtitle" style={subTitleStyle}>
            6 minutes
          </div>
          <div className="play-button" style={playButtonStyle}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="play-icon" style={arrowStyle}>
              <path
                d="M7.74,31.44C5.67,32.69,4,31.74,4,29.32V2.67C4,
                .25,5.68-.7,7.74.55L29.56,13.73c2.07,1.25,2.06,3.28,0,4.52Z"
              />
            </svg>
          </div>
        </div>
      </div>
      <video width="100%" height="100%" controls id="player" onPlay={setWasClicked.bind(false, true)}>
        <source src="https://codepost-videos.s3.us-east-2.amazonaws.com/codepost_overview.mp4" type="video/mp4" />
      </video>
    </div>
  );
};

export { LandingVideo };
