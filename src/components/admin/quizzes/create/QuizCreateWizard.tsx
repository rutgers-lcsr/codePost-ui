// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Button, Flex, Modal, Steps, message } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import CPButton from '../../../core/CPButton';
import { quizzesApi } from '../../../../api-client/clients';
import { Course, Quiz } from '../../../../api-client';
import { apiErrorMessage } from '../../../../lib/apiError';
import { useAssignmentsQuery } from '../../hooks/useAssignmentsQuery';
import {
  DEFAULT_DRAFT,
  QuizCreateDraft,
  SEB_KEY_RE,
  WizardStepKey,
  buildCreatePayload,
  createBlockers,
} from './quizDraft';
import { STEP_HELP } from './stepHelp';
import BasicsStep from './steps/BasicsStep';
import AvailabilityStep from './steps/AvailabilityStep';
import AttemptsGradingStep from './steps/AttemptsGradingStep';
import ResultsStep from './steps/ResultsStep';
import SecurityDeliveryStep from './steps/SecurityDeliveryStep';
import AiGenerationStep from './steps/AiGenerationStep';
import ReviewStep from './steps/ReviewStep';

const STEPS: Array<{ key: WizardStepKey; title: string }> = [
  { key: 'basics', title: 'Basics' },
  { key: 'availability', title: 'Availability' },
  { key: 'attempts', title: 'Attempts' },
  { key: 'results', title: 'Results' },
  { key: 'security', title: 'Security' },
  { key: 'ai', title: 'AI questions' },
  { key: 'review', title: 'Review' },
];

interface IProps {
  open: boolean;
  course: Course;
  onCancel: () => void;
  /** Fired with the created quiz; the parent closes the wizard, invalidates, and selects. */
  onCreated: (quiz: Quiz) => void;
}

/** The New Quiz workflow: a stepper over every settings group, so the quiz is created the
 *  way the instructor wants it in a single POST. "Skip & create" on any step creates
 *  immediately with whatever is set so far (from step 1 that equals the old title-only
 *  modal). Only the access code (server-managed) and AI sections (need a quiz id) are
 *  configured afterwards in the builder. */
const QuizCreateWizard: React.FC<IProps> = ({ open, course, onCancel, onCreated }) => {
  const [draft, setDraft] = React.useState<QuizCreateDraft>(DEFAULT_DRAFT);
  const [stepIdx, setStepIdx] = React.useState(0);
  const [creating, setCreating] = React.useState(false);
  // Once opened, the help panel stays open across steps (it shows the current step's help).
  const [helpOpen, setHelpOpen] = React.useState(false);
  const { data: assignments = [] } = useAssignmentsQuery(course);

  // Fresh state each time the wizard opens.
  React.useEffect(() => {
    if (open) {
      setDraft(DEFAULT_DRAFT);
      setStepIdx(0);
    }
  }, [open]);

  const patch = (p: Partial<QuizCreateDraft>) => setDraft((d) => ({ ...d, ...p }));

  const stepKey = STEPS[stepIdx].key;
  const isLast = stepIdx === STEPS.length - 1;

  const handleNext = () => {
    // Only step-local gates here; cross-step rules run in createBlockers at create time.
    if (stepKey === 'basics' && !draft.title.trim()) {
      message.error('Please name the quiz.');
      return;
    }
    if (stepKey === 'security' && draft.sebConfigKey.trim() && !SEB_KEY_RE.test(draft.sebConfigKey.trim())) {
      message.error('The SEB Config Key must be exactly 64 hex characters (or leave it empty).');
      return;
    }
    setStepIdx(stepIdx + 1);
  };

  const doCreate = async (isPublished: boolean) => {
    const blockers = createBlockers(draft);
    if (blockers.length > 0) {
      message.error(blockers[0].message);
      setStepIdx(STEPS.findIndex((s) => s.key === blockers[0].step));
      return;
    }
    setCreating(true);
    try {
      const created = await quizzesApi.create({ quiz: buildCreatePayload(draft, course.id!, isPublished) });
      message.success(isPublished ? 'Quiz created and published.' : 'Quiz created.');
      onCreated(created);
    } catch (err) {
      message.error(
        apiErrorMessage(err, 'title', 'sebConfigKey', 'assignmentTrigger', 'closeEvent', 'generationDate', 'assignment') ??
          'Failed to create quiz.',
      );
    } finally {
      setCreating(false);
    }
  };

  const stepProps = { draft, patch, courseId: course.id! };

  return (
    <Modal
      title="New Quiz"
      open={open}
      onCancel={onCancel}
      // Wide enough that seven step titles render on one line each (antd caps the modal at
      // the viewport on small screens).
      width={920}
      destroyOnHidden
      data-testid="quiz-create-wizard"
      footer={[
        stepIdx > 0 && (
          <Button key="back" onClick={() => setStepIdx(stepIdx - 1)} disabled={creating} data-testid="quiz-wizard-back">
            Back
          </Button>
        ),
        !isLast && (
          <CPButton
            key="skip"
            cpType="secondary"
            onClick={() => doCreate(false)}
            loading={creating}
            data-testid="quiz-wizard-skip"
          >
            Skip & create
          </CPButton>
        ),
        !isLast && (
          <Button key="next" type="primary" onClick={handleNext} disabled={creating} data-testid="quiz-wizard-next">
            Next
          </Button>
        ),
        isLast && (
          <CPButton
            key="create-draft"
            cpType="secondary"
            onClick={() => doCreate(false)}
            loading={creating}
            data-testid="quiz-wizard-create-draft"
          >
            Create as draft
          </CPButton>
        ),
        isLast && (
          <CPButton
            key="create-publish"
            cpType="primary"
            onClick={() => doCreate(true)}
            loading={creating}
            data-testid="quiz-wizard-create-publish"
          >
            Create & publish
          </CPButton>
        ),
      ]}
    >
      <Steps
        current={stepIdx}
        size="small"
        items={STEPS.map((s) => ({ title: s.title }))}
        style={{ marginBottom: 8 }}
        data-testid="quiz-wizard-steps"
      />
      <Flex justify="flex-end" style={{ marginBottom: 8 }}>
        <Button
          type="link"
          size="small"
          icon={<QuestionCircleOutlined />}
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((v) => !v)}
          data-testid="quiz-wizard-help-toggle"
        >
          {helpOpen ? 'Hide help' : 'About this step'}
        </Button>
      </Flex>
      {helpOpen && (
        <Alert
          type="info"
          message={STEP_HELP[stepKey]}
          style={{ marginBottom: 16 }}
          data-testid="quiz-wizard-help"
        />
      )}
      {stepKey === 'basics' && <BasicsStep {...stepProps} />}
      {stepKey === 'availability' && <AvailabilityStep {...stepProps} assignments={assignments} />}
      {stepKey === 'attempts' && <AttemptsGradingStep {...stepProps} />}
      {stepKey === 'results' && <ResultsStep {...stepProps} />}
      {stepKey === 'security' && <SecurityDeliveryStep {...stepProps} />}
      {stepKey === 'ai' && <AiGenerationStep {...stepProps} />}
      {stepKey === 'review' && <ReviewStep {...stepProps} assignments={assignments} />}
    </Modal>
  );
};

export default QuizCreateWizard;
