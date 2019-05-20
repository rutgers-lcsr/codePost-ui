import React from 'react';

import { storiesOf } from '@storybook/react';

import CPComment from '../components/core/CPComment';

// import { StorybookContainer } from './helpers';

import { CommentMock } from '../infrastructure/comment';
import { RubricCommentMock } from '../infrastructure/rubricComment';

storiesOf('Comment', module)
  .add('Active', () => (
    <div style={{ backgroundColor: '#f2f2f2', height: '1000px', width: '1000px', position: 'relative' }}>
      <CPComment commentType="active" comment={CommentMock} rubricComment={RubricCommentMock} />
    </div>
  ))
  .add('Inactive', () => (
    <div style={{ backgroundColor: '#f2f2f2', height: '1000px', width: '1000px', position: 'relative' }}>
      <CPComment commentType="inactive" comment={CommentMock} rubricComment={RubricCommentMock} />
    </div>
  ))
  .add('Readonly', () => (
    <div style={{ backgroundColor: '#f2f2f2', height: '1000px', width: '1000px', position: 'relative' }}>
      <CPComment commentType="readonly" comment={CommentMock} rubricComment={RubricCommentMock} />
    </div>
  ));
