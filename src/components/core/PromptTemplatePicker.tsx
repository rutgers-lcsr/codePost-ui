// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { Select, Typography } from 'antd';

const { Text } = Typography;

/** The minimum shape a template needs to appear in the picker. Callers pass richer types
 *  (e.g. the quiz's QuizSectionTemplate, which also carries questionTypes) and get them back
 *  in `onSelect`. */
export interface TemplateOption {
  key: string;
  label: string;
  description: string;
}

interface IProps<T extends TemplateOption> {
  templates: T[];
  /** Fired when a template is chosen. The caller decides how to apply it (load its text into
   *  an editor field, and for quizzes also apply questionTypes / sample rows). */
  onSelect: (template: T) => void;
  /** Fired when the selection is cleared. */
  onClear?: () => void;
  /** Selected key for controlled use (e.g. the quiz keeps the picker showing its choice). Omit
   *  for a one-shot "load a template" action that always reads as empty. */
  value?: string | null;
  /** Optional label rendered above the select. */
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  testId?: string;
}

/**
 * "Start from a template" picker — a dropdown of starter prompts (label + description) that
 * loads the chosen one into a prompt editor. Shared by the assignment AI editors, the Prompt
 * Lab, and the quiz builder; generalizes the quiz builder's original inline preset Select.
 */
function PromptTemplatePicker<T extends TemplateOption>({
  templates,
  onSelect,
  onClear,
  value,
  label,
  placeholder = 'Choose a starter prompt…',
  disabled,
  testId,
}: IProps<T>) {
  const select = (
    <Select
      allowClear
      showSearch
      optionFilterProp="label"
      style={{ width: '100%' }}
      placeholder={placeholder}
      value={value ?? undefined}
      disabled={disabled}
      data-testid={testId}
      onChange={(key?: string) => {
        if (!key) {
          onClear?.();
          return;
        }
        const template = templates.find((t) => t.key === key);
        if (template) onSelect(template);
      }}
      options={templates.map((t) => ({ value: t.key, label: t.label }))}
      optionRender={(option) => {
        const template = templates.find((t) => t.key === option.value);
        return (
          <div>
            <div>{template?.label ?? option.label}</div>
            {template?.description ? (
              <Text type="secondary" style={{ fontSize: 12 }}>
                {template.description}
              </Text>
            ) : null}
          </div>
        );
      }}
    />
  );

  if (!label) return select;
  return (
    <div>
      <Text strong style={{ display: 'block', marginBottom: 4 }}>
        {label}
      </Text>
      {select}
    </div>
  );
}

export default PromptTemplatePicker;
