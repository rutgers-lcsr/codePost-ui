// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Divider, Flex, Input, Space, Switch, Typography } from 'antd';
import { SEB_KEY_RE } from '../quizDraft';
import { StepProps } from './types';

const { Text } = Typography;

/** Exam security (Safe Exam Browser) and question delivery (shuffle / one-at-a-time). */
const SecurityDeliveryStep: React.FC<StepProps> = ({ draft, patch }) => {
  const keyEntered = draft.sebConfigKey.trim();
  const keyInvalid = keyEntered.length > 0 && !SEB_KEY_RE.test(keyEntered);

  return (
    <Flex vertical gap={12} data-testid="quiz-wizard-step-security">
      <div>
        <Text strong style={{ display: 'block', marginBottom: 2 }}>
          Exam security
        </Text>
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
          Require students to take this quiz in Safe Exam Browser, a free locked-down browser (Windows,
          macOS, iPad). Students get a “Launch in Safe Exam Browser” button — no setup needed. Per-student
          exemptions (e.g. Linux/ChromeOS users) are set on the roster.
        </Text>
        <Flex vertical gap={10}>
          <Space>
            <Switch
              aria-label="Require Safe Exam Browser"
              checked={draft.requireSebBrowser}
              onChange={(v) => patch({ requireSebBrowser: v })}
              data-testid="quiz-wizard-require-seb"
            />
            <Text>Require Safe Exam Browser</Text>
          </Space>
          {draft.requireSebBrowser && (
            <div style={{ marginLeft: 36 }}>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
                Optional: Config Key of your own SEB configuration (64 hex characters, shown in the SEB
                Config Tool) — only needed if you distribute a custom .seb file instead of the built-in
                launch
              </Text>
              <Input
                aria-label="SEB Config Key"
                placeholder="e.g. 81aad4ab9dfd447cc479e6a4a7c9a544…"
                style={{ width: 420, maxWidth: '100%', fontFamily: 'monospace' }}
                maxLength={64}
                status={keyInvalid ? 'error' : undefined}
                value={draft.sebConfigKey}
                onChange={(e) => patch({ sebConfigKey: e.target.value })}
                data-testid="quiz-wizard-seb-config-key"
              />
              {keyInvalid && (
                <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
                  The Config Key must be exactly 64 hex characters (or leave it empty).
                </Text>
              )}
            </div>
          )}
        </Flex>
      </div>
      <Divider style={{ margin: '4px 0' }} />
      <div>
        <Text strong style={{ display: 'block', marginBottom: 12 }}>
          Question delivery
        </Text>
        <Flex vertical gap={10}>
          <Space>
            <Switch
              aria-label="Shuffle question order"
              checked={draft.shuffleQuestions}
              onChange={(v) => patch({ shuffleQuestions: v })}
            />
            <Text>Shuffle question order</Text>
          </Space>
          <Space>
            <Switch
              aria-label="One question at a time"
              checked={draft.oneQuestionAtATime}
              onChange={(v) => patch({ oneQuestionAtATime: v })}
            />
            <Text>One question at a time</Text>
          </Space>
          {draft.oneQuestionAtATime && (
            <Space style={{ marginLeft: 36 }}>
              <Switch
                size="small"
                aria-label="Let students go back to previous questions"
                checked={draft.allowBacktracking}
                onChange={(v) => patch({ allowBacktracking: v })}
              />
              <Text type="secondary">Let students go back to previous questions</Text>
            </Space>
          )}
        </Flex>
      </div>
    </Flex>
  );
};

export default SecurityDeliveryStep;
