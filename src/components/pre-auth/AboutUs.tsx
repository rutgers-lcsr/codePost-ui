/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Typography } from 'antd';

/* codePost imports */
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
            manual review of student code at Princeton used...pens and paper. codePost's first (humble) goal was to
            digitize that process to save paper.
          </div>
          <br />
          <div>
            Since, we’ve expanded to many more universities (and countries!)! If you have any ideas to help make
            codePost a better teaching tool, please let us know!
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default AboutUs;
