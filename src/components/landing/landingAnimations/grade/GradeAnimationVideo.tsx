import React from 'react';
import useWindowSize from '../../../core/useWindowSize';

const GradeAnimationVideo = (props: { width: number; height: number; controls: number }) => {
  const windowSize = useWindowSize();
  return (
    <div className="animation--grade" style={{ maxWidth: props.width, maxHeight: props.height }}>
      <video
        width={props.width}
        height={props.height}
        autoPlay
        muted
        loop
        controls={windowSize.width < props.controls ? true : false}
      >
        <source src={require('./gradeAnimation-v2.mp4')} type="video/mp4" />
      </video>
    </div>
  );
};

export default GradeAnimationVideo;
