import React from 'react';

import { withKnobs } from '@storybook/addon-knobs';
import { storiesOf } from '@storybook/react';

import CPFileMenu from '../components/core/CPFileMenu';
import CPMainNav from '../components/core/CPMainNav';
import CPRubricMenu from '../components/core/CPRubricMenu';

import { FileMock, FileType } from '../infrastructure/file';
import { RubricCategoryMock } from '../infrastructure/rubricCategory';
import { RubricCommentMock } from '../infrastructure/rubricComment';

// --------- Mock Data --------- //

const category1 = RubricCategoryMock;
const category2 = { ...RubricCategoryMock, id: 2, name: 'Another Category' };

const comment1 = RubricCommentMock;
const comment2 = { ...RubricCommentMock, id: 2, text: 'another rubric comment' };
const comment3 = { ...RubricCommentMock, id: 3, category: 2, text: 'missing a semicolon' };

const rubricCategories = [category1, category2];
const rubricComments = { 1: [comment1, comment2], 2: [comment3] };

const file1 = FileMock;
const file2 = { ...FileMock, id: 2, name: 'loops.java', comments: [2] };

const files = [file1, file2];

const getPointsInFile = (file: FileType): number => {
  return Math.floor(Math.random() * 10) - 4;
};

// ------------------------------ //

const onClick = (e: any) => null;

storiesOf('Menus', module)
  .addDecorator(withKnobs)
  .add('Main Navigation', () => <CPMainNav onClick={onClick} />)
  .add('Rubric Menu', () => <CPRubricMenu rubricCategories={rubricCategories} rubricComments={rubricComments} />)
  .add('File Menu', () => <CPFileMenu files={files} getPointsInFile={getPointsInFile} />);
