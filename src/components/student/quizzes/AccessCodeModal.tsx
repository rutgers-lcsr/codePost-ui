// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Flex, Input, Modal, Typography } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizAttemptsApi } from '../../../api-client/clients';
import { StudentQuiz } from '../../../api-client';
import { apiErrorMessage } from '../../../lib/apiError';
import { studentKeys } from '../../../lib/queryKeys';
import { parseAccessCode403 } from './accessCode';

const { Text } = Typography;

interface IProps {
  quiz: StudentQuiz;
  open: boolean;
  onClose: () => void;
  /** Called once the code is accepted and the attempt has started — navigate into the quiz. */
  onStarted: () => void;
}

/** Prompts a late student for the quiz's access code and starts the attempt with it. Opened
 *  from a closed quiz card (QuizActions). Validation is entirely server-side: a wrong code
 *  re-prompts with an error; a correct one starts the attempt (with the normal time limit) and
 *  hands off to the taking view, which resumes the now-in-progress attempt. */
const AccessCodeModal: React.FC<IProps> = ({ quiz, open, onClose, onStarted }) => {
  const queryClient = useQueryClient();
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Start fresh each time the modal opens.
  React.useEffect(() => {
    if (open) {
      setCode('');
      setError(null);
    }
  }, [open]);

  const submit = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('Enter the access code your instructor gave you.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await quizAttemptsApi.create({ startQuizAttemptRequest: { quiz: quiz.id!, accessCode: trimmed } });
      // The attempt now exists — refresh the card, then hand off to the taking view (which
      // resumes it, no code needed).
      queryClient.invalidateQueries({ queryKey: studentKeys.availableQuizzes(quiz.course) });
      queryClient.invalidateQueries({ queryKey: studentKeys.quizAttempts(quiz.id!) });
      onClose();
      onStarted();
    } catch (e) {
      const body = await parseAccessCode403(e);
      if (body?.accessCodeRequired) {
        setError("That access code isn't valid. Check with your instructor and try again.");
      } else {
        // A different refusal (e.g. no attempts remaining) — surface the server's reason.
        setError(body?.detail ?? apiErrorMessage(e) ?? 'This quiz could not be started.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Enter access code"
      open={open}
      onOk={submit}
      onCancel={onClose}
      okText="Start quiz"
      confirmLoading={submitting}
      destroyOnHidden
    >
      <Flex vertical gap={12}>
        <Text type="secondary">
          Your instructor gave you a code to take &ldquo;{quiz.title}&rdquo; after it closed. Entering it starts
          your attempt with the normal time limit.
        </Text>
        <Input
          autoFocus
          aria-label="Access code"
          placeholder="Access code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onPressEnter={submit}
          disabled={submitting}
          data-testid="quiz-access-code-input"
        />
        {error && <Alert type="error" showIcon message={error} data-testid="quiz-access-code-error" />}
      </Flex>
    </Modal>
  );
};

export default AccessCodeModal;
