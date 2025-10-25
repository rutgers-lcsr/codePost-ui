/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */

import { CalendarOutlined, CrownOutlined, IdcardOutlined, ProfileOutlined } from '@ant-design/icons';

/* ant imports */
import { Button, Typography } from 'antd';

import { colors } from '../../theme/colors';

/* other library imports */

/* codePost imports */
import useWindowSize from '../core/useWindowSize';
import PreAuthLayout from './PreAuthLayout';

import graderMeeting from '../../img/landing/compressed/codePost_grader_meeting.jpg';
import scholarshipImage from '../../img/landing/compressed/codePost_scholarship_image.jpg';

interface IProps {
  isLoggedIn: boolean;
}

const Scholarship = (props: IProps) => {
  const breakpoint = 700;
  const windowSize = useWindowSize();

  const isMobile = windowSize.width < breakpoint;

  const aboutScholarship = (
    <div>
      <Typography.Title level={2}>About this scholarship</Typography.Title>
      <div style={{ marginBottom: 25 }}>
        Our mission at{' '}
        <a className="landing__link" href="https://codepost.cs.rutgers.edu" target="_blank" rel="noopener noreferrer">
          codePost
        </a>{' '}
        is to <b style={{ fontWeight: 600 }}>advance Computer Science education</b> by empowering educators to give
        higher-quality feedback at scale.
      </div>
      <div style={{ marginBottom: 25 }}>
        We know firsthand that{' '}
        <span style={{ fontWeight: 600, color: colors.brandPrimary }}>
          Computer Science students play key roles in advancing CS education.
        </span>
      </div>

      <div style={{ marginBottom: 25 }}>
        It’s within the DNA of budding programmers to seek out real-world problems and build solutions to them. Students
        often contribute to CS education in their schools in a number of ways, from building tools to serving as
        teaching assistants to mentoring younger students.
      </div>

      <div style={{ marginBottom: 25 }}>
        These students devote their time to improve the way computer science is taught and understood. Along the way,
        they’re re-imagining the building blocks that their peers will use to change the world.
      </div>

      <div style={{ marginBottom: 25, fontWeight: 500 }}>
        Through this scholarship, we want to recognize these individuals, and encourage them to continue improving
        Computer Science education.
      </div>
    </div>
  );
  const ourStory = (
    <div style={{ color: 'grey' }}>
      <Typography.Title level={3} style={{ color: '#476b63' }}>
        Our Story
      </Typography.Title>
      <div style={{ marginBottom: 25 }}>
        <div style={{ marginBottom: 15 }}>
          We first built codePost as undergraduate students, inspired to improve our department's grading process.
        </div>
        <div style={{ marginBottom: 15 }}>
          It’s now used across 70+ CS departments across the world, and has been used to provide better feedback to tens
          of thousands of students, while saving instructors countless hours.
        </div>
        <div style={{ marginBottom: 15 }}>
          During this journey, we have experienced first-hand the value that personalized instruction can give to the
          development of CS students. With this scholarship, we hope to give back to those educators that make this a
          part of their mission.
        </div>
      </div>
    </div>
  );

  const details = (
    <div style={{ textAlign: 'left' }}>
      <div style={{ marginBottom: 25 }}>
        <Typography.Title level={3} style={{ fontSize: 20, color: 'grey' }}>
          <CalendarOutlined style={{ marginRight: 10 }} />
          Timeline
        </Typography.Title>
        <div style={{ paddingLeft: 20 }}>
          <div style={{ marginBottom: 10 }}>
            <Typography.Title level={4} style={{ color: 'grey' }}>
              Deadline to apply:
            </Typography.Title>
            <div style={{ fontSize: 18 }}>June 30th, 2020</div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <Typography.Title level={4} style={{ color: 'grey' }}>
              Winners announced:
            </Typography.Title>
            <div style={{ fontSize: 18 }}>July 31th, 2020</div>
          </div>
        </div>
      </div>
      <div style={{ marginBottom: 25 }}>
        <Typography.Title level={3} style={{ fontSize: 20, color: 'grey' }}>
          <CrownOutlined style={{ marginRight: 10 }} />
          Amount
        </Typography.Title>
        <Typography.Title level={4} style={{ paddingLeft: 20, color: 'grey' }}>
          $500 Scholarship
        </Typography.Title>
      </div>
      <div style={{ marginBottom: 25 }}>
        <Typography.Title level={3} style={{ fontSize: 20, color: 'grey' }}>
          <IdcardOutlined style={{ marginRight: 10 }} />
          Eligibility
        </Typography.Title>
        <div style={{ paddingLeft: 20, fontSize: 16 }}>
          Currently pursuing an undergraduate or graduate degree in Computer Science (or related field)
        </div>
      </div>
      <div style={{ marginBottom: 25 }}>
        <Typography.Title level={3} style={{ fontSize: 20, color: 'grey' }}>
          <ProfileOutlined style={{ marginRight: 10 }} />
          Selection Criteria
        </Typography.Title>
        <div style={{ fontSize: 16 }}>
          <ul>
            <li>Passion for CS education</li>
            <li>Tangible improvements made to CS education within their school or community</li>
          </ul>
        </div>
      </div>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', padding: 15 }}>
        <Button
          href="https://bold.org/scholarships/codepost-computer-science-education-scholarship/"
          type="primary"
          target="_blank"
          style={{ fontSize: 24, width: 175, height: 70, lineHeight: '70px' }}
        >
          Apply
        </Button>
      </div>
    </div>
  );

  return (
    <PreAuthLayout isLoggedIn={props.isLoggedIn}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginBottom: isMobile ? 40 : 100, textAlign: 'center', width: '100%' }}>
          <img src={scholarshipImage} style={{ maxWidth: '100%' }} alt="codePost scholarship background" />
        </div>
        <div style={{ fontWeight: 600, fontSize: isMobile ? 22 : 30, textAlign: 'center' }}>
          Recognizing students who advance Computer Science education
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            width: '100%',
            maxWidth: 1100,
            marginTop: isMobile ? 30 : 50,
          }}
        >
          <div
            style={{
              textAlign: isMobile ? 'center' : 'left',
              width: '100%',
              fontSize: isMobile ? 16 : 20,
              paddingRight: isMobile ? 0 : 100,
            }}
          >
            {aboutScholarship}
          </div>
          <div
            style={{
              maxWidth: 350,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'center',
              color: 'grey',
              backgroundColor: '#f5f5f7',
              padding: 25,
              height: 'fit-content',
            }}
          >
            {details}
          </div>
        </div>
        <div
          style={{
            maxWidth: 850,
            paddingTop: isMobile ? 50 : 75,
            paddingBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              width: '100%',
              fontSize: isMobile ? 16 : 20,
            }}
          >
            {ourStory}
          </div>
          <img
            src={graderMeeting}
            style={{ width: '100%', maxWidth: 750, padding: 35 }}
            alt="One of the first grading sessions in which codePost was used, when we were students in 2015."
          />
          <div style={{ fontSize: 20, marginTop: 10, color: 'grey', fontStyle: 'italic', textAlign: 'center' }}>
            One of the first grading sessions in which codePost was used, when we were students in 2015.
          </div>
        </div>
      </div>
    </PreAuthLayout>
  );
};

export default Scholarship;
