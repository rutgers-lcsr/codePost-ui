import React, { useState, Suspense } from 'react';

import LandingPanel from './LandingPanel';
import { colors } from '../../../theme/colors';

const AnnotationModule = React.lazy(() => import('./../landingAnimations/annotation/AnnotationModule'));

const LandingAnnotationPanel = () => {
  const [index, setIndex] = useState(0);

  return (
    <LandingPanel
      text={
        <div>
          <div style={{ paddingBottom: 15 }}>
            Use codePost to annotate{' '}
            <span
              style={{ color: index === 0 ? colors.green8 : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 0)}
            >
              code
            </span>{' '}
            with easy-to-read comments. Write custom comments, or apply a standardized rubric. We support commenting on{' '}
            <span
              style={{ color: index === 1 ? colors.green8 : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 1)}
            >
              Jupyter notebooks
            </span>{' '}
            and{' '}
            <span
              style={{ color: index === 2 ? colors.green8 : '', fontWeight: 600, cursor: 'pointer' }}
              onClick={setIndex.bind({}, 2)}
            >
              PDFs
            </span>{' '}
            too.
          </div>
        </div>
      }
      title="Code commenting"
      subTitle="Effortlessly annotate programming assignments"
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
