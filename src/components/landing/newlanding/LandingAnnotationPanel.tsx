import React, { useState, Suspense } from 'react';

import LandingPanel from './LandingPanel';

const AnnotationModule = React.lazy(() => import('./landingAnimations/annotation/AnnotationModule'));

const LandingAnnotationPanel = () => {
  const [index, setIndex] = useState(0);

  return (
    <LandingPanel
      text={
        <div>
          <div style={{ paddingBottom: 15 }}>
            Use codePost to annotate{' '}
            <span
              style={{ color: index === 0 ? '#24be85' : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 0)}
            >
              code
            </span>{' '}
            with easy-to-read comments. You and your course staff can provide custom feedback, as well as apply
            standardized rubrics. And we support{' '}
            <span
              style={{ color: index === 1 ? '#24be85' : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 1)}
            >
              Jupyter notebooks
            </span>{' '}
            and{' '}
            <span
              style={{ color: index === 2 ? '#24be85' : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 2)}
            >
              PDFs
            </span>{' '}
            too.
          </div>
        </div>
      }
      title="Code commenting"
      subTitle="Effortlessly annotate and grade programming assignments"
      module={
        <Suspense fallback={<div>Loading...</div>}>
          <AnnotationModule index={index} />
        </Suspense>
      }
      type="left"
      moduleMaxWidth={595}
      moduleMaxHeight={380}
      removeModelSmallScreen={false}
      gutterSize={50}
    />
  );
};

export default LandingAnnotationPanel;
