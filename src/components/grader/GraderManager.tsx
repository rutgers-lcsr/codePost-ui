/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* codePost imports */
import ComponentManager from '../core/ComponentManager';

import Grader from './Grader';

/**********************************************************************************************************************/

const GraderManager = ComponentManager(Grader, (c) => {
  return c.activateQueue ? 'my_submissions' : 'my_sections';
});

export default GraderManager;
