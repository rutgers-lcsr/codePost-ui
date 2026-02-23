// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
import { colors } from '../../theme/colors';

const art = `
Welcome to...
%c
                _      _____          _
               | |    |  __ \\        | |
   ___ ___   __| | ___| |__) |__  ___| |_
  / __/ _ \\ / _\` |/ _ \\  ___/ _ \\/ __| __|
 | (_| (_) | (_| |  __/ |  | (_) \\__ \\ |_
  \\___\\___/ \\__,_|\\___|_|   \\___/|___/\\__|


%cCheckout our API: https://codepost-api.cs.rutgers.edu/api/schema/elements/
`;

// prettier-ignore
export const consoleArt = [
  art,
  `color: ${colors.brandPrimary}`,
  'color: #C0C0C0',
];
