// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import React from 'react';
import type { UserType } from '../../types/models';
import DevPanel from './DevPanel';

interface IProps {
  replaceUser: (user: UserType, redirect: boolean, isSuperUser: boolean) => void;
}

const DevTools: React.FC<IProps> = (props) => {
  return <DevPanel replaceUser={props.replaceUser} />;
};

export default DevTools;
