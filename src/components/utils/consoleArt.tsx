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


%cCheckout our API: https://docs.codepost.io/reference
`;

// prettier-ignore
export const consoleArt = [
  art,
  `color: ${colors.brandPrimary}`,
  'color: #C0C0C0',
];
