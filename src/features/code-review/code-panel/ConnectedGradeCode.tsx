// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import * as React from 'react';
import { useCodeConsoleStore } from '../../../stores/useCodeConsoleStore';
import { GradeCode } from './CodeContent';

/**
 * Connected wrapper for GradeCode to isolate high-frequency updates.
 */
const ConnectedGradeCode = React.memo((props: React.ComponentProps<typeof GradeCode> & { fileId: number }) => {
  const temporaryContent = useCodeConsoleStore((s) => s.temporaryFileContent[props.fileId]);
  const isDiffMode = useCodeConsoleStore((s) => s.isDiffMode);
  return <GradeCode {...props} temporaryContent={temporaryContent} isDiffMode={isDiffMode} />;
});

export default ConnectedGradeCode;
