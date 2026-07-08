// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Mentions, Typography } from 'antd';
import { PromptVariable } from '../../api-client';

const { Text } = Typography;

interface IProps {
  value?: string;
  onChange?: (value: string) => void;
  /** The insertable {variables}, e.g. from `quizzes/{id}/promptVariables/`. */
  variables: PromptVariable[];
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}

/**
 * A textarea for prompt templates with `{variable}` autocomplete: typing `{` opens a
 * picker fed by a prompt-variables endpoint, and selecting inserts the full token
 * (e.g. `{assignment_file:starter.py}`). Reusable for any template-aware editor —
 * pass whatever variable list the surrounding context supports.
 */
const TemplateTextArea: React.FC<IProps> = ({ value, onChange, variables, placeholder, rows = 6, disabled }) => {
  const options = React.useMemo(
    () =>
      variables.map((v) => ({
        // Mentions completes to prefix + value, so the value is the token minus its
        // leading '{' (keeping the trailing '}' closes the variable on insert).
        value: v.token.slice(1),
        key: v.token,
        label: (
          <span>
            <Text code>{v.token}</Text>{' '}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {v.label}
            </Text>
          </span>
        ),
      })),
    [variables],
  );

  return (
    <Mentions
      value={value}
      onChange={onChange}
      prefix="{"
      split=""
      options={options}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      filterOption={(input, option) =>
        String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
      }
    />
  );
};

export default TemplateTextArea;
