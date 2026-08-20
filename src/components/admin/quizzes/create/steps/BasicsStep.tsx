// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Flex, Input, Typography } from 'antd';
import MarkdownField from '../../MarkdownField';
import { StepProps } from './types';

const { Text } = Typography;

/** Title + description — the old two-field create modal. Skip & create from here matches
 *  the pre-wizard behavior exactly. */
const BasicsStep: React.FC<StepProps> = ({ draft, patch, courseId }) => (
  <Flex vertical gap={12} data-testid="quiz-wizard-step-basics">
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        Title <Text type="danger">*</Text>
      </Text>
      <Input
        aria-label="Quiz title"
        placeholder="e.g., Week 1 Quiz"
        maxLength={128}
        value={draft.title}
        onChange={(e) => patch({ title: e.target.value })}
      />
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
        Description (optional, Markdown)
      </Text>
      <MarkdownField
        value={draft.description}
        onChange={(v) => patch({ description: v })}
        courseId={courseId}
        minRows={3}
        ariaLabel="Quiz description"
        placeholder="What this quiz covers — supports Markdown and images…"
      />
      <Text type="secondary" style={{ fontSize: 12 }}>
        Appears on the quiz page while the student is taking the quiz — instructions, context, honor code.
      </Text>
    </div>
  </Flex>
);

export default BasicsStep;
