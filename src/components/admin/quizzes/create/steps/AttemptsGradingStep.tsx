// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, InputNumber, Select, Space, Typography } from 'antd';
import { QuizPassingScoreUnitEnum, QuizScoringPolicyEnum } from '../../../../../api-client';
import { StepProps } from './types';

const { Text } = Typography;

/** Time limit, attempt count, multi-attempt scoring, and pass threshold. */
const AttemptsGradingStep: React.FC<StepProps> = ({ draft, patch }) => (
  <Flex gap={16} wrap align="start" data-testid="quiz-wizard-step-attempts">
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        Time limit (min)
      </Text>
      <InputNumber
        min={1}
        aria-label="Time limit in minutes"
        placeholder="Untimed"
        style={{ width: 130 }}
        value={draft.timeLimitMinutes ?? undefined}
        onChange={(v) => patch({ timeLimitMinutes: v ?? null })}
      />
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        Attempts allowed
      </Text>
      <InputNumber
        min={0}
        aria-label="Attempts allowed (0 for unlimited)"
        style={{ width: 110 }}
        value={draft.attemptsAllowed}
        onChange={(v) => patch({ attemptsAllowed: v ?? 1 })}
      />
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
        0 = unlimited
      </Text>
    </div>
    {draft.attemptsAllowed !== 1 && (
      <div>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
          Score to keep
        </Text>
        <Select
          aria-label="Score to keep across attempts"
          style={{ width: 180 }}
          value={draft.scoringPolicy}
          onChange={(v) => patch({ scoringPolicy: v })}
          options={[
            { value: QuizScoringPolicyEnum.Highest, label: 'Highest attempt' },
            { value: QuizScoringPolicyEnum.Latest, label: 'Latest attempt' },
            { value: QuizScoringPolicyEnum.Average, label: 'Average of attempts' },
          ]}
        />
      </div>
    )}
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        Passing score
      </Text>
      <Space.Compact>
        <InputNumber
          min={0}
          max={draft.passingScoreUnit === QuizPassingScoreUnitEnum.Percent ? 100 : undefined}
          aria-label="Passing score"
          placeholder="None"
          style={{ width: 110 }}
          value={draft.passingScore ?? undefined}
          onChange={(v) => patch({ passingScore: v ?? null })}
        />
        <Select
          aria-label="Passing score unit"
          style={{ width: 100 }}
          value={draft.passingScoreUnit}
          onChange={(u) => {
            // Avoid a guaranteed 400: percent can't exceed 100.
            if (u === QuizPassingScoreUnitEnum.Percent && draft.passingScore != null && draft.passingScore > 100) {
              patch({ passingScoreUnit: u, passingScore: 100 });
            } else {
              patch({ passingScoreUnit: u });
            }
          }}
          options={[
            { value: QuizPassingScoreUnitEnum.Percent, label: '%' },
            { value: QuizPassingScoreUnitEnum.Points, label: 'points' },
          ]}
        />
      </Space.Compact>
    </div>
  </Flex>
);

export default AttemptsGradingStep;
