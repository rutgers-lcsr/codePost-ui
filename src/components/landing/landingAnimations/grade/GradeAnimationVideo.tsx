import useWindowSize from '../../../core/useWindowSize';
import gradeAnimationVideo from './gradeAnimation.mp4';

const GradeAnimationVideo = (props: { width: number; height: number; controls: number }) => {
  const windowSize = useWindowSize();

  return (
    <div style={{ maxWidth: props.width, maxHeight: props.height }}>
      <video
        width={props.width}
        height={props.height}
        autoPlay
        muted
        loop
        controls={windowSize.width < props.controls ? true : false}
      >
        <source src={gradeAnimationVideo} type="video/mp4" />
      </video>
    </div>
  );
};

export default GradeAnimationVideo;
