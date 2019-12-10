/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button, Icon, Table, Typography } from 'antd';

/* other library imports */
import { Link } from 'react-router-dom';

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

/**********************************************************************************************************************/

interface IProps {
  isLoggedIn: boolean;
}

const AboutUs = (props: IProps) => {
  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div>
        <div
          className="display-flex justify-content-center"
          style={{ width: '60%', flexDirection: 'column', margin: '0 auto' }}
        >
          <Typography.Title level={3}>
            codePost’s mission is to help CS teachers give students great feedback on programming work
          </Typography.Title>
          <br />
          <div>
            The original codePost was developed at Princeton University by a team of undergraduates. Back then, all
            manual review of student code at Princeton used...pens and paper. codePost first (humble) goal was to
            digitize that process to save paper.
          </div>
          <br />
          <div>
            Since, we’ve expanded to many more universities (and countries!), and we’re just getting started! If you
            have any ideas to help make codePost a better teaching tool, please let us know!
          </div>
          <br />
          <div>And if you are really excited about what we’re up to, consider joining us!</div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default AboutUs;
