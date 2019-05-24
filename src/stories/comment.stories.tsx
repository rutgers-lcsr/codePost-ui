import React from 'react';

import { number, select, text, withKnobs } from '@storybook/addon-knobs';

import { storiesOf } from '@storybook/react';

import CPComment from '../components/core/CPComment';

import { CommentMock } from '../infrastructure/comment';
import { RubricCommentMock } from '../infrastructure/rubricComment';

const reallyLongComment = `This is a really really really
really really really really really really
really really really really really really
really really really really really really
really really really really really really
long long long long long long
long long long long long long
long long long long long long
long long long long long long
comment. But we can expand it.`;

storiesOf('Comment', module)
  .addDecorator(withKnobs)
  .add('Active', () => {
    const commentAuthor = select('author', [null, 'grader@myschool.edu'], 'grader@myschool.edu');
    const comment = { ...CommentMock, author: commentAuthor };

    const points = number('points', 3);
    const rubricComment = { ...RubricCommentMock, pointDelta: points };
    return (
      <div style={{ backgroundColor: '#f2f2f2', height: '1000px', width: '100vw', position: 'relative' }}>
        <CPComment commentType="active" comment={comment} rubricComment={rubricComment} />
      </div>
    );
  })
  .add('Inactive', () => {
    const commentAuthor = select('author', [null, 'grader@myschool.edu'], 'grader@myschool.edu');
    const commentText = text('Comment Text', reallyLongComment);
    const comment = { ...CommentMock, text: commentText, author: commentAuthor };

    const points = number('points', 3);
    const rubricComment = { ...RubricCommentMock, pointDelta: points };
    return (
      <div style={{ backgroundColor: '#f2f2f2', height: '1000px', width: '100vw', position: 'relative' }}>
        <CPComment commentType="inactive" comment={comment} rubricComment={rubricComment} />
      </div>
    );
  })
  .add('Readonly', () => {
    const commentAuthor = select('author', [null, 'grader@myschool.edu'], 'grader@myschool.edu');
    const commentText = text('Comment Text', reallyLongComment);
    const comment = { ...CommentMock, text: commentText, author: commentAuthor };

    const points = number('points', 3);
    const rubricComment = { ...RubricCommentMock, pointDelta: points };
    return (
      <div style={{ backgroundColor: '#f2f2f2', height: '1000px', width: '100vw', position: 'relative' }}>
        <CPComment commentType="readonly" comment={comment} rubricComment={rubricComment} />
      </div>
    );
  });
