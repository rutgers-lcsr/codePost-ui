import React from 'react';

import { withKnobs } from '@storybook/addon-knobs';

import { storiesOf } from '@storybook/react';

import { SimpleAssignments } from './../components/LandingAnimations/Admin/SimpleAssignments';
import { SimpleGraderRoster } from './../components/LandingAnimations/Admin/SimpleGraderRoster';
import { SimpleMenu } from './../components/LandingAnimations/Admin/SimpleMenu';
import { SimpleRubric } from './../components/LandingAnimations/Admin/SimpleRubric';
import { SimpleStudentDrilldown } from './../components/LandingAnimations/Admin/SimpleStudentDrilldown';
import { SimpleStudentSubmissions } from './../components/LandingAnimations/Admin/SimpleStudentSubmissions';

import { SimpleCodeBox } from './../components/LandingAnimations/Grade/SimpleCodeBox';
import { SimpleGradeHeader } from './../components/LandingAnimations/Grade/SimpleGradeHeader';
import { SimpleGradeMenu } from './../components/LandingAnimations/Grade/SimpleGradeMenu';

storiesOf('Animations-Admin', module)
  .addDecorator(withKnobs)
  .add('Admin-Assignments', () => <SimpleAssignments mouseOver={false} />)
  .add('Admin-Rubric', () => <SimpleRubric />)
  .add('Admin-StudentSubmissions', () => <SimpleStudentSubmissions mouseOver={false} />)
  .add('Admin-StudentDrilldown', () => <SimpleStudentDrilldown student="student0" />)
  .add('Admin-GraderRoster', () => <SimpleGraderRoster />)
  .add('Admin-Menu', () => <SimpleMenu number={['1']} openKey={['1']} />);

storiesOf('Animations-Grade', module)
  .addDecorator(withKnobs)
  .add('Grade-CodeBox', () => <SimpleCodeBox />)
  .add('Grade-Header', () => <SimpleGradeHeader grade="17/20" />)
  .add('Grade-Menu', () => <SimpleGradeMenu selectedKeys={['1']} />);
