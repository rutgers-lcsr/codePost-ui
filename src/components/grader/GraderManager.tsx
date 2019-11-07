/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* codePost imports */
import ComponentManager from '../core/ComponentManager';

import Grader from './Grader';

/**********************************************************************************************************************/

const GraderManager = ComponentManager(Grader, 'my_submissions');

export default GraderManager;
