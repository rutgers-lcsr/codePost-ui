import React, { useState, useEffect } from 'react';

import LandingPanel from './LandingPanel';

import AnnotationModule from './landingAnimations/annotation/AnnotationModule';

const LandingAnnotationPanel = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setIndex((prevState) => {
        switch (prevState) {
          case 0:
            return 1;
          case 1:
            return 2;
          case 2:
            return 0;
          default:
            return 0;
        }
      });
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <LandingPanel
      text={
        <div>
          <div style={{ paddingBottom: 15 }}>
            Use codePost to annotate programming assignments with easy-to-read comments that don't clutter{' '}
            <span
              style={{ color: index == 0 ? '#24be85' : '', fontWeight: index == 0 ? 600 : 500 }}
              onClick={setIndex.bind({}, 0)}
            >
              code
            </span>
            . You and your course staff can provide custom feedback, as well as apply standardized rubrics. And we
            support{' '}
            <span
              style={{ color: index == 1 ? '#24be85' : '', fontWeight: index == 1 ? 600 : 500 }}
              onClick={setIndex.bind({}, 1)}
            >
              Jupyter notebooks
            </span>{' '}
            and{' '}
            <span
              style={{ color: index == 2 ? '#24be85' : '', fontWeight: index == 2 ? 600 : 500 }}
              onClick={setIndex.bind({}, 2)}
            >
              PDFs
            </span>{' '}
            too.
          </div>
        </div>
      }
      title="ANNOTATE STUDENT CODE"
      subTitle="Effortlessly annotate and grade programming assignments"
      module={<AnnotationModule index={index} />}
      type="left"
      moduleMaxWidth={595}
      moduleMaxHeight={380}
      textSize="normal"
      removeModelSmallScreen={false}
      gutterSize={50}
    />
  );
};

export default LandingAnnotationPanel;
