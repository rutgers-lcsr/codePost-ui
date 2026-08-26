// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import type { UserType } from '../../types/models';
import DevPanel from './DevPanel';

interface IProps {
  replaceUser: (user: UserType, redirect: boolean, isSuperUser: boolean) => void;
}

const DevTools: React.FC<IProps> = (props) => {
  // The docs screenshot harness sets this flag so dev chrome never appears in
  // captured documentation images (see e2e/docs/capture.spec.ts).
  if (window.localStorage.getItem('codepost:hide-dev-tools')) return null;
  return <DevPanel replaceUser={props.replaceUser} />;
};

export default DevTools;
