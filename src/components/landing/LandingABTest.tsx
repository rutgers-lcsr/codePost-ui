import { Experiment, Variant } from 'react-optimize';

import React, { useState, useEffect } from 'react';

import LandingOld from './Landing.tsx';
import LandingNew from './newlanding/Landing.tsx';

const Landing = (props: any) => {
  // Set up an A/B Test
  // FIXME: Standardize this code to make a standard A/B test function
  // Code for this inspired by: https://medium.com/adhawk-engineering/how-to-add-google-optimize-a-b-testing-to-your-react-app-in-10-lines-of-code-8310b58e51f4
  const [variant, setVariant] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchvariant = async () => {
      if ((window as any).dataLayer) {
        const promise = (window as any).dataLayer.push({ event: 'optimize.activate' });
        await promise;
      }
    };
    fetchvariant();

    let timesRun = 0; // we don't want our interval to stall indefinetely
    const interval = setInterval(() => {
      console.log('trying');
      timesRun += 1;
      if ((window as any).google_optimize !== undefined) {
        const variant = (window as any).google_optimize.get('3QqwNXa5QM2R_SgYK6dSVw');
        console.log(variant);
        if (variant !== undefined) {
          setVariant(variant);
          setLoaded(true);
          clearInterval(interval);
        }
      }
      if (timesRun > 10) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    return () => {
      clearInterval(interval);
    };
    // Should implement useCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return <div />;
  }

  if (variant === 1) {
    return <LandingNew {...props} />;
  }

  return <LandingOld {...props} />;
};

export default Landing;
