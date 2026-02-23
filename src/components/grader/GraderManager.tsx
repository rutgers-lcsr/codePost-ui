// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
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
