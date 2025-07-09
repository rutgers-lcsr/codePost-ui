/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* codePost imports */
import ComponentManager from '../core/ComponentManager';

import Admin from './Admin';

/**********************************************************************************************************************/

const AdminManager = ComponentManager(Admin, 'assignments/overview');

export default AdminManager;
