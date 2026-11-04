// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Col, Empty, Row, Tabs, Typography } from 'antd';
import { Course, QuestionBank, Quiz } from '../../../api-client';
import CPAdminDetail from '../other/CPAdminDetail';
import QuestionBanksPanel from './QuestionBanksPanel';
import QuestionsPanel from './QuestionsPanel';
import QuizzesListPanel from './QuizzesListPanel';
import QuizBuilder from './QuizBuilder';

interface IProps {
  course: Course;
}

const QuizzesManager: React.FC<IProps> = ({ course }) => {
  const [selectedBank, setSelectedBank] = React.useState<QuestionBank | undefined>(undefined);
  const [selectedQuiz, setSelectedQuiz] = React.useState<Quiz | undefined>(undefined);

  const banksTab = (
    <Row gutter={24}>
      <Col xs={24} lg={9}>
        <QuestionBanksPanel courseId={course.id!} selectedBankId={selectedBank?.id} onSelect={setSelectedBank} />
      </Col>
      <Col xs={24} lg={15}>
        {selectedBank ? (
          <QuestionsPanel course={course} bank={selectedBank} />
        ) : (
          <Empty
            description="Select a question bank to view and edit its questions"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 80 }}
          />
        )}
      </Col>
    </Row>
  );

  const quizzesTab = (
    <Row gutter={24}>
      <Col xs={24} lg={9}>
        <QuizzesListPanel course={course} selectedQuizId={selectedQuiz?.id} onSelect={setSelectedQuiz} />
      </Col>
      <Col xs={24} lg={15}>
        {selectedQuiz ? (
          // Keyed so switching quizzes remounts the builder — its tab panes stay mounted
          // once visited, so without this quiz A's grading/review state would show against
          // quiz B's data.
          <QuizBuilder key={selectedQuiz.id} course={course} quiz={selectedQuiz} />
        ) : (
          <Empty
            description="Select a quiz to build it from your question banks"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ marginTop: 80 }}
          />
        )}
      </Col>
    </Row>
  );

  // Same page frame as the other sections (breadcrumb, title, white card).
  return (
    <CPAdminDetail
      goBack={null}
      title="Quizzes"
      actions={[]}
      content={
        <>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
            Author reusable question banks, then assemble questions into quizzes and attach them to assignments. A
            question can live in several banks and be reused across quizzes.
          </Typography.Paragraph>

          <Tabs
            defaultActiveKey="quizzes"
            items={[
              { key: 'quizzes', label: 'Quizzes', children: quizzesTab },
              { key: 'banks', label: 'Question Banks', children: banksTab },
            ]}
          />
        </>
      }
    />
  );
};

export default QuizzesManager;
