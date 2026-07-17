// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { Alert, Checkbox, Flex, Input, Modal, Radio, Select, Spin, Typography, Upload, message } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useQueryClient } from '@tanstack/react-query';
import { quizImportJobsApi } from '../../../api-client/clients';
import { quizKeys } from '../../../lib/queryKeys';
import { getAuthToken } from '../../../utils/auth';
import { useQuestionBanks } from './queries';

const { Text, Paragraph } = Typography;

interface IProps {
  open: boolean;
  courseId: number;
  onClose: () => void;
}

type Phase = 'idle' | 'working' | 'done' | 'error';

interface ImportSummary {
  imported_questions?: number;
  imported_quizzes?: number;
  skipped?: { ident?: string; reason?: string }[];
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ImportQuestionsModal: React.FC<IProps> = ({ open, courseId, onClose }) => {
  const queryClient = useQueryClient();
  const { data: banks = [] } = useQuestionBanks(open ? courseId : undefined);
  const [fileList, setFileList] = React.useState<UploadFile[]>([]);
  const [targetMode, setTargetMode] = React.useState<'new' | 'existing'>('new');
  const [bankName, setBankName] = React.useState('');
  const [targetBankId, setTargetBankId] = React.useState<number | undefined>(undefined);
  const [importQuizzes, setImportQuizzes] = React.useState(false);
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [result, setResult] = React.useState<{ summary: ImportSummary } | null>(null);
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setFileList([]);
      setTargetMode('new');
      setBankName('');
      setTargetBankId(undefined);
      setImportQuizzes(false);
      setPhase('idle');
      setResult(null);
      setErrorMsg('');
    }
  }, [open]);

  const file = fileList[0]?.originFileObj ?? (fileList[0] as unknown as File | undefined);

  const parseSummary = (raw: unknown): ImportSummary => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    }
    return raw as ImportSummary;
  };

  const handleImport = async () => {
    if (!file) {
      message.warning('Choose a QTI / Common Cartridge export (.zip / .imscc / .xml).');
      return;
    }
    setPhase('working');
    setErrorMsg('');
    try {
      const form = new FormData();
      form.append('course', String(courseId));
      form.append('file', file as Blob);
      if (targetMode === 'existing' && targetBankId) {
        form.append('targetBankId', String(targetBankId));
      } else if (bankName.trim()) {
        form.append('bankName', bankName.trim());
      }
      form.append('importQuizzes', importQuizzes ? 'true' : 'false');

      const res = await fetch(`${process.env.REACT_APP_API_URL}/quizImportJobs/`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getAuthToken()}` },
        body: form,
      });
      if (!res.ok) {
        throw new Error((await res.text()) || res.statusText);
      }
      let job = await res.json();

      // Poll until the import job reaches a terminal state (eager Celery in dev may
      // already be done on the first response).
      let attempts = 0;
      while (job.status !== 'completed' && job.status !== 'failed' && attempts < 60) {
        await sleep(1000);
        job = await quizImportJobsApi.retrieve({ id: job.id });
        attempts += 1;
      }

      if (job.status === 'failed') {
        setPhase('error');
        setErrorMsg(job.errorMessage || 'The import failed while parsing the file.');
        return;
      }
      if (job.status !== 'completed') {
        setPhase('error');
        setErrorMsg('The import is taking longer than expected. Check back shortly.');
        return;
      }

      setResult({ summary: parseSummary(job.summary) });
      setPhase('done');
      queryClient.invalidateQueries({ queryKey: quizKeys.banks(courseId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.list(courseId) });
    } catch (e) {
      setPhase('error');
      setErrorMsg(e instanceof Error ? e.message : 'Upload failed.');
    }
  };

  const skipped = result?.summary.skipped ?? [];

  return (
    <Modal
      title="Import questions"
      open={open}
      onCancel={onClose}
      okText={phase === 'done' ? 'Done' : 'Import'}
      confirmLoading={phase === 'working'}
      onOk={phase === 'done' ? onClose : handleImport}
      cancelButtonProps={{ style: { display: phase === 'done' ? 'none' : undefined } }}
      destroyOnHidden
    >
      {phase === 'done' && result ? (
        <Flex vertical gap={12} style={{ marginTop: 12 }}>
          <Alert
            type="success"
            showIcon
            title={`Imported ${result.summary.imported_questions ?? 0} question(s) and ${
              result.summary.imported_quizzes ?? 0
            } quiz(zes).`}
          />
          {skipped.length > 0 && (
            <div>
              <Text type="secondary">Skipped {skipped.length} unsupported item(s):</Text>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18, maxHeight: 160, overflow: 'auto' }}>
                {skipped.map((s, i) => (
                  <li key={i}>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {s.ident ? `${s.ident}: ` : ''}
                      {s.reason}
                    </Text>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Flex>
      ) : (
        <Flex vertical gap={16} style={{ marginTop: 12 }}>
          <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
            Upload a QTI / IMS Common Cartridge export (<Text code>.imscc</Text>/<Text code>.zip</Text>{' '}
            or QTI <Text code>.xml</Text>) — e.g. exported from Canvas or another LMS. Supported question types are
            imported; unsupported ones are listed and skipped.
          </Paragraph>

          <Upload.Dragger
            accept=".zip,.imscc,.xml"
            maxCount={1}
            multiple={false}
            fileList={fileList}
            beforeUpload={(f) => {
              setFileList([{ uid: f.uid, name: f.name, originFileObj: f } as UploadFile]);
              if (!bankName.trim()) setBankName(f.name.replace(/\.[^.]+$/, ''));
              return false; // prevent auto-upload; we POST manually
            }}
            onRemove={() => setFileList([])}
          >
            <p className="ant-upload-drag-icon" style={{ marginBottom: 4 }}>
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">Click or drag a QTI / Common Cartridge export here</p>
          </Upload.Dragger>

          <div>
            <Radio.Group
              aria-label="Import target"
              value={targetMode}
              onChange={(e) => setTargetMode(e.target.value)}
              style={{ marginBottom: 8 }}
            >
              <Radio value="new">New bank</Radio>
              <Radio value="existing" disabled={banks.length === 0}>
                Existing bank
              </Radio>
            </Radio.Group>
            {targetMode === 'new' ? (
              <Input
                aria-label="New bank name"
                placeholder="New bank name"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                maxLength={128}
              />
            ) : (
              <Select
                aria-label="Choose a bank"
                placeholder="Choose a bank"
                style={{ width: '100%' }}
                value={targetBankId}
                onChange={(v) => setTargetBankId(v)}
                options={banks.map((b) => ({ value: b.id, label: b.name }))}
              />
            )}
          </div>

          <Checkbox checked={importQuizzes} onChange={(e) => setImportQuizzes(e.target.checked)}>
            Also recreate any quizzes found in the export
            <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Off by default — only the questions are imported into the bank.
            </Text>
          </Checkbox>

          {phase === 'working' && (
            <Flex align="center" gap={8} role="status">
              <Spin size="small" />
              <Text type="secondary">Uploading and parsing…</Text>
            </Flex>
          )}
          {phase === 'error' && <Alert type="error" showIcon title="Import failed" description={errorMsg} />}
        </Flex>
      )}
    </Modal>
  );
};

export default ImportQuestionsModal;
