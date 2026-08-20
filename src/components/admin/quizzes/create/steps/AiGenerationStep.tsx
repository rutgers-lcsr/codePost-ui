// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, DatePicker, Flex, Space, Switch, Typography } from 'antd';
import dayjs from 'dayjs';
import { StepProps } from './types';

const { Text } = Typography;

/** Per-student AI generation flags. A new quiz has no generated sections yet, so these are
 *  forward-looking defaults; the coupled-toggle semantics mirror QuizSettingsCard. */
const AiGenerationStep: React.FC<StepProps> = ({ draft, patch }) => (
  <Flex vertical gap={12} data-testid="quiz-wizard-step-ai">
    <Alert
      type="info"
      showIcon
      message={
        'These options only apply if you add AI-generated personalized question sections in the ' +
        'builder. You can change them any time in Quiz Settings.'
      }
    />
    <Flex vertical gap={10}>
      <Space>
        <Switch
          aria-label="Publish generated questions automatically"
          checked={draft.autoPublishGenerated}
          onChange={(v) => patch({ autoPublishGenerated: v })}
        />
        <Text>Publish generated questions automatically (skip review)</Text>
      </Space>
      <Space>
        <Switch
          aria-label="Graders may review and publish generated questions"
          checked={draft.gradersCanReviewGenerated}
          // A grader can only reach the generate button through the review tab, so
          // revoking review also revokes generate — no hidden-but-active state.
          onChange={(v) =>
            patch(v ? { gradersCanReviewGenerated: true }
                    : { gradersCanReviewGenerated: false, gradersCanGenerate: false })
          }
        />
        <Text>Graders may review and publish generated questions</Text>
      </Space>
      {draft.gradersCanReviewGenerated && (
        <Space style={{ marginLeft: 36 }}>
          <Switch
            size="small"
            aria-label="Graders may also generate missing question sets"
            checked={draft.gradersCanGenerate}
            onChange={(v) => patch({ gradersCanGenerate: v })}
          />
          <Text type="secondary">Graders may also generate missing question sets (spends AI credits)</Text>
        </Space>
      )}
      <Space>
        <Switch
          aria-label="Generate question sets manually"
          checked={draft.manualGeneration}
          // The backend rejects a generation time without manual mode, so turning
          // the toggle off must clear the date in the same patch.
          onChange={(v) =>
            patch(v ? { manualGeneration: true } : { manualGeneration: false, generationDate: null })
          }
        />
        <Text>Generate question sets manually (turn off automatic generation)</Text>
      </Space>
      {draft.manualGeneration && (
        <div style={{ marginLeft: 36 }}>
          <DatePicker
            showTime
            aria-label="Scheduled generation time"
            placeholder="Generate missing at… (optional)"
            value={draft.generationDate ? dayjs(draft.generationDate) : null}
            onChange={(d) => patch({ generationDate: d ? d.toISOString() : null })}
          />
          <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4, maxWidth: 440 }}>
            Optional one-time run: at this time, question sets are generated for students who have a
            submission but no set yet. The run only fires once the quiz is published.
          </Text>
        </div>
      )}
    </Flex>
  </Flex>
);

export default AiGenerationStep;
