// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';

import { Tag } from 'antd';

/** Gold "Needs grading" / green "Graded" pair used across the grading surfaces. */
export const GradingStatusTag: React.FC<{ needsGrading: boolean }> = ({ needsGrading }) =>
  needsGrading ? <Tag color="gold">Needs grading</Tag> : <Tag color="green">Graded</Tag>;

/** Passed / Not-passed tag; renders nothing when the quiz has no pass threshold. */
export const PassedTag: React.FC<{ passed: boolean | null | undefined }> = ({ passed }) =>
  passed === true ? (
    <Tag color="success">Passed</Tag>
  ) : passed === false ? (
    <Tag color="error">Did not pass</Tag>
  ) : null;
