import React, { useState, Suspense } from 'react';

import LandingPanel from './LandingPanel';
import { colors } from '../../theme/colors';

const AnnotationModule = React.lazy(() => import('./landingAnimations/annotation/AnnotationModule'));

const LandingAnnotationPanel = () => {
  const [index, setIndex] = useState(0);

  return (
    <LandingPanel
      text={
        <div>
          <div style={{ paddingBottom: 15 }}>
            Use codePost to annotate programming assignments with easy-to-read comments that don't clutter{' '}
            <span
              style={{ color: index === 0 ? colors.brandPrimary : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 0)}
            >
              code
            </span>
            . You and your course staff can provide custom feedback, as well as apply standardized rubrics. And we
            support{' '}
            <span
              style={{ color: index === 1 ? colors.brandPrimary : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 1)}
            >
              Jupyter notebooks
            </span>{' '}
            and{' '}
            <span
              style={{ color: index === 2 ? colors.brandPrimary : '', fontWeight: 600, cursor: 'pointer' }}
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
      module={
        <Suspense fallback={<div>Loading...</div>}>
          <AnnotationModule index={index} />
        </Suspense>
      }
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
