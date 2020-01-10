import { Experiment, Variant } from 'react-optimize';

import * as React from 'react';

import LandingOld from './Landing.tsx';
import LandingNew from './newlanding/Landing.tsx';

const Landing = (props: any) => {
  return (
    <Experiment id="xsaR0R8XRW-wxSJMV-MfuQ">
      <Variant id="0">
        <LandingOld {...props} />
      </Variant>
      <Variant id="1">
        <LandingNew {...props} />
      </Variant>
    </Experiment>
  );
};

export default Landing;
