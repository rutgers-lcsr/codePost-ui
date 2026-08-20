// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Flex, Select, Space, Switch, Typography } from 'antd';
import { neverClosesDraft } from '../quizDraft';
import { StepProps } from './types';

const { Text } = Typography;

/** What students see about their results once they turn in an attempt. */
const ResultsStep: React.FC<StepProps> = ({ draft, patch }) => (
  <Flex vertical gap={12} data-testid="quiz-wizard-step-results">
    {draft.sealResultsUntilClose && neverClosesDraft(draft) && (
      <Alert
        type="warning"
        showIcon
        message={
          'Results are set to release after the quiz closes, but no close is configured — set a ' +
          'close time in Availability, or release results as soon as students submit.'
        }
      />
    )}
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        When results are released
      </Text>
      <Select
        aria-label="When results are released"
        style={{ width: 220 }}
        value={draft.sealResultsUntilClose ? 'after_close' : 'immediately'}
        onChange={(v) => patch({ sealResultsUntilClose: v === 'after_close' })}
        options={[
          { value: 'immediately', label: 'As soon as they submit' },
          { value: 'after_close', label: 'After the quiz closes' },
        ]}
      />
      {draft.sealResultsUntilClose && (
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 320 }}>
          Scores, points, and the answer key stay hidden — on the quiz card and on review — until the
          quiz closes for the student.
        </Text>
      )}
    </div>
    <Space>
      <Switch
        aria-label="Let students reopen submitted attempts"
        checked={draft.allowSubmissionReview}
        onChange={(v) => patch({ allowSubmissionReview: v })}
      />
      <Text>Let students reopen submitted attempts</Text>
    </Space>
    {!draft.allowSubmissionReview && (
      <Text type="secondary" style={{ fontSize: 12, display: 'block', maxWidth: 400 }}>
        Students get a submission confirmation only — they can&apos;t reopen a submitted attempt. Their
        score still appears on the quiz card once results are released.
      </Text>
    )}
    <Flex gap={16} wrap align="start">
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Results students see
        </Text>
        <Select
          aria-label="Results students see after submitting"
          style={{ width: 200 }}
          disabled={!draft.allowSubmissionReview}
          value={draft.showResponses ? 'full' : 'scores'}
          onChange={(v) => patch({ showResponses: v === 'full' })}
          options={[
            { value: 'full', label: 'Scores + their answers' },
            { value: 'scores', label: 'Scores only' },
          ]}
        />
        {draft.allowSubmissionReview && !draft.showResponses && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 200 }}>
            On review, students see their score but not the questions or their answers.
          </Text>
        )}
      </div>
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Show correct answers
        </Text>
        <Space>
          <Switch
            aria-label="Show the correct-answer key on review"
            disabled={!draft.allowSubmissionReview || !draft.showResponses}
            checked={draft.showCorrectAnswers}
            onChange={(v) => patch({ showCorrectAnswers: v })}
          />
          <Text type={!draft.allowSubmissionReview || !draft.showResponses ? 'secondary' : undefined}>
            Reveal the answer key on review
          </Text>
        </Space>
        {(!draft.allowSubmissionReview || !draft.showResponses) && (
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 220 }}>
            {!draft.allowSubmissionReview
              ? 'Available when students can reopen submissions.'
              : 'Available when students see their answers (not “Scores only”).'}
          </Text>
        )}
      </div>
    </Flex>
  </Flex>
);

export default ResultsStep;
