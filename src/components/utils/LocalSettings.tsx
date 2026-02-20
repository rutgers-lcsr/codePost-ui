/******************************************************************************************************************
 * This file defines settings which are stored locally while a user is logged in.
 * To define a setting, you must define:
 *   - a key (e.g. "darkMode")
 *   - a return type (e.g. boolean)
 *   - a default value (to be used when the getter function is called and the setting isn't set)
 *
 * Then you must use the generic setLocalSetting and getLocalSetting functions
 * to construct setter and getter functions specific to your variable.
 ******************************************************************************************************************/

/* generic setter and getter functions */
function generateSettingFunctions<T>(
  key: string,
  defaultVal: T,
  inputParser: (val: T) => string,
  outputParser: (val: string) => T,
) {
  const setter = (value: T) => {
    return localStorage.setItem(key, inputParser(value));
  };

  const getter = () => {
    const storedVal = localStorage.getItem(key);
    if (storedVal === null) {
      return defaultVal;
    } else {
      return outputParser(storedVal);
    }
  };

  return { setter, getter };
}

function clearLocalSettings() {
  Object.keys(LOCAL_SETTINGS).forEach((key) => {
    localStorage.removeItem(key);
  });
}

/******************************************************************************************************************/

const booleanOParser = (value: string) => {
  return value === 'true';
};

const booleanIParser = (value: boolean) => {
  return value.toString();
};

const floatOParser = (value: string) => {
  return parseFloat(value);
};

const floatIParser = (value: number) => {
  return value.toString();
};

const intOParser = (value: string) => {
  return parseInt(value);
};

const intIParser = (value: number) => {
  return value.toString();
};

export const PAGE_SIZE_OPTIONS = ['10', '25', '50', '100'];
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE_SIZE_STORAGE_KEY = 'defaultPageSize';
export const DEFAULT_PAGE_SIZE_CHANGE_EVENT = 'codepost:defaultPageSizeChanged';

const validPageSizes = new Set(PAGE_SIZE_OPTIONS.map((option) => parseInt(option, 10)));

const normalizePageSize = (value: string | number | null | undefined): number => {
  const parsed = typeof value === 'number' ? value : parseInt(value || '', 10);
  if (!Number.isFinite(parsed) || !validPageSizes.has(parsed)) {
    return DEFAULT_PAGE_SIZE;
  }
  return parsed;
};

/******************************************************************************************************************/

// key: darkMode
// return type: boolean. If true = dark mode is enabled. Else, dark mode is not enabled.
// defalut value: false
const darkMode = generateSettingFunctions('darkMode', false, booleanIParser, booleanOParser);

// key: cursorMode
// return type: boolean. If true = cursor mode is enabled. Else, cursor mode is not enabled.
// defalut value: false
const cursorMode = generateSettingFunctions('cursorMode', false, booleanIParser, booleanOParser);

// key: infoMenuHidden
// return type: boolean. If true, submission info section of code console will be collapsed.
// defalut value: false
const infoMenuHidden = generateSettingFunctions('infoMenuHidden', false, booleanIParser, booleanOParser);

// key: fileMenuHidden
// return type: boolean. If true, file menu section of code console will be collapsed.
// defalut value: false
const fileMenuHidden = generateSettingFunctions('fileMenuHidden', false, booleanIParser, booleanOParser);

// key: testsMenuHidden
// return type: boolean. If true, tests menu section of code console will be collapsed.
// defalut value: false
const testsMenuHidden = generateSettingFunctions('testsMenuHidden', false, booleanIParser, booleanOParser);

// key: rubricMenuHidden
// return type: boolean. If true, rubric menu section of code console will be collapsed.
// defalut value: false
const rubricMenuHidden = generateSettingFunctions('rubricMenuHidden', false, booleanIParser, booleanOParser);

// key: codeZoom
// return type: float. Represents the zoom level applied to the code console
// defalut value: 1.0
const codeZoom = generateSettingFunctions('codeZoom', 1.0, floatIParser, floatOParser);

// key: codeWidth
// return type: float. Represents the width (in pixels) of the code displayed in the code console
// defalut value: 0.0
const codeWidth = generateSettingFunctions('codeWidth', 0, floatIParser, floatOParser);

// key: siderWidth
// return type: float. Represents the width (in pixels) of the sider displayed in the code console
// defalut value: 300.0
const siderWidth = generateSettingFunctions('siderWidth', 300.0, floatIParser, floatOParser);

// key: defaultCourse
// return type: int. Represents the id of the default course rendered in the admin console
// defalut value: 0
const defaultCourse = generateSettingFunctions('defaultCourse', 0, intIParser, intOParser);

// key: defaultAssignment
// return type: int. Represents the id of the default assignment rendered in the grader console
// defalut value: 0
const defaultAssignment = generateSettingFunctions('defaultAssignment', 0, intIParser, intOParser);

// key: mostRecentFile
// return type: int. Represents the id of the most recently visited file
// defalut value: 0
const mostRecentFile = generateSettingFunctions('mostRecentFile', 0, intIParser, intOParser);

// key: sendMeAConfirmationEmail
// return type: boolean. Student upload confirmation checkbox will default to this value.
// defalut value: false
const sendMeAConfirmationEmail = generateSettingFunctions(
  'sendMeAConfirmationEmail',
  false,
  booleanIParser,
  booleanOParser,
);

// key: rubricMenuHidden
// return type: boolean. If true, rubric menu section of code console will be collapsed.
// defalut value: false
const autograderInstructionsVisible = generateSettingFunctions(
  'autograderInstructionsVisible',
  true,
  booleanIParser,
  booleanOParser,
);

// key: defaultPageSize
// return type: int. Represents the desired page size of paginated tables
// defalut value: 10
const defaultPageSize = {
  setter: (value: number) => {
    const normalizedValue = normalizePageSize(value);
    localStorage.setItem(DEFAULT_PAGE_SIZE_STORAGE_KEY, intIParser(normalizedValue));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<number>(DEFAULT_PAGE_SIZE_CHANGE_EVENT, { detail: normalizedValue }));
    }
  },
  getter: () => {
    const storedVal = localStorage.getItem(DEFAULT_PAGE_SIZE_STORAGE_KEY);
    return normalizePageSize(storedVal);
  },
};

/******************************************************************************************************************/
const LOCAL_SETTINGS = {
  darkMode,
  cursorMode,
  infoMenuHidden,
  fileMenuHidden,
  testsMenuHidden,
  rubricMenuHidden,
  codeZoom,
  codeWidth,
  siderWidth,
  defaultCourse,
  defaultAssignment,
  mostRecentFile,
  autograderInstructionsVisible,
  sendMeAConfirmationEmail,
  defaultPageSize,
};

export { LOCAL_SETTINGS, clearLocalSettings };
