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

/******************************************************************************************************************/

// key: darkMode
// return type: boolean. If true = dark mode is enabled. Else, dark mode is not enabled.
// defalut value: false
const darkMode = generateSettingFunctions('darkMode', false, booleanIParser, booleanOParser);

// key: infoMenuHidden
// return type: boolean. If true, submission info section of code console will be collapsed.
// defalut value: false
const infoMenuHidden = generateSettingFunctions('infoMenuHidden', false, booleanIParser, booleanOParser);

// key: fileMenuHidden
// return type: boolean. If true, file menu section of code console will be collapsed.
// defalut value: false
const fileMenuHidden = generateSettingFunctions('fileMenuHidden', false, booleanIParser, booleanOParser);

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
// defalut value: 1.0
const codeWidth = generateSettingFunctions('codeWidth', 0, floatIParser, floatOParser);

/******************************************************************************************************************/
const LOCAL_SETTINGS = {
  darkMode,
  infoMenuHidden,
  fileMenuHidden,
  rubricMenuHidden,
  codeZoom,
  codeWidth,
};

export { LOCAL_SETTINGS, clearLocalSettings };
