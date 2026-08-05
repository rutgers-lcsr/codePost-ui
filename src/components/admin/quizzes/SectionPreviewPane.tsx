// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Card, Collapse, Divider, Empty, Spin, Tag, Typography } from 'antd';
import { QuestionTypeEnum } from '../../../api-client';
import { typeMeta } from '../../core/questionMeta';
import AnswerPreview from './AnswerPreview';
import { parseChoices } from './SuggestionCard';
import Markdown from '../../core/Markdown';

const { Text } = Typography;

/** One example question from a section-prompt test run (the shape the preview task
 *  writes into QuizSuggestionJob.resultData — camelCase, GeneratedQuizQuestion names). */
export interface PreviewQuestion {
  questionType: string;
  text: string;
  description: string;
  choicesData: { text: string; isCorrect: boolean; feedback: string }[];
  language?: string | null;
  starterCode?: string | null;
  referenceSolution: string;
}

export interface PreviewResult {
  seed: 'random' | 'demo' | 'none';
  sampleStudent: string | null;
  resolvedPrompt: string;
  questions: PreviewQuestion[];
}

interface IProps {
  testing: boolean;
  result: PreviewResult | null;
  pointsPerQuestion: number;
}

const seedNote = (result: PreviewResult): string => {
  if (result.seed === 'random' && result.sampleStudent) {
    return `Example based on ${result.sampleStudent}'s latest submission — each student gets their own questions.`;
  }
  if (result.seed === 'demo') {
    return 'Example generated from your demo files — each student gets their own questions.';
  }
  return "Example — this prompt doesn't use submission data.";
};

/** Read-only preview pane for the section modal's Test button: example questions as the
 *  model generated them, plus the resolved prompt for inspection. Nothing is saved. */
const SectionPreviewPane: React.FC<IProps> = ({ testing, result, pointsPerQuestion }) => {
  if (testing) {
    return (
      <div role="status" style={{ textAlign: 'center', padding: '48px 0' }}>
        <Spin />
        <div style={{ marginTop: 12 }}>
          <Text type="secondary">Generating example questions… this can take a minute.</Text>
        </div>
      </div>
    );
  }
  if (!result) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="No test run yet"
        style={{ padding: '48px 0' }}
      />
    );
  }
  return (
    <div data-testid="section-preview-pane">
      <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
        {seedNote(result)}
      </Text>
      {result.questions.map((q, i) => {
        const qType = (q.questionType || 'multiple_choice') as QuestionTypeEnum;
        const meta = typeMeta(qType);
        return (
          <Card size="small" style={{ marginBottom: 12 }} key={i}>
            <Tag color={meta.color}>{meta.label}</Tag>
            <div style={{ marginTop: 8, fontSize: 14 }}>
              <Markdown>{q.text}</Markdown>
            </div>
            {q.description && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(0,0,0,0.65)' }}>
                <Markdown>{q.description}</Markdown>
              </div>
            )}
            <Divider style={{ margin: '8px 0' }} />
            <AnswerPreview
              questionType={qType}
              choices={parseChoices(q.choicesData)}
              language={q.language}
              starterCode={q.starterCode}
              emptyText="No choices were generated."
            />
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 10 }}>
              {pointsPerQuestion} pts
            </Text>
            {q.referenceSolution && (
              <Collapse
                ghost
                size="small"
                items={[{
                  key: 'key',
                  label: 'Answer key / reference solution (never shown to students)',
                  children: <Markdown>{q.referenceSolution}</Markdown>,
                }]}
              />
            )}
          </Card>
        );
      })}
      {result.resolvedPrompt && (
        <Collapse
          ghost
          size="small"
          items={[{
            key: 'prompt',
            label: 'Request details — the resolved prompt the model saw',
            children: (
              <pre style={{
                fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 260, overflow: 'auto', margin: 0,
              }}>
                {result.resolvedPrompt}
              </pre>
            ),
          }]}
        />
      )}
    </div>
  );
};

export default SectionPreviewPane;
