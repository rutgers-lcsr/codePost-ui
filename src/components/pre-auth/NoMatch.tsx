/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import * as React from 'react';

/* ant imports */
import { Button } from 'react-md';

/* codePost imports */
import { TopBarNoEmail } from '../TopBar';

/**********************************************************************************************************************/

const NoMatch = () => {
  return (
    <div>
      <TopBarNoEmail />
      <div className="error-page">
        <img className="error-page__image" src={require('../../img/404_error.png')} />
        <Button href="/login" key="Login" className="error-page__button" flat={true} />
      </div>
    </div>
  );
};

export default NoMatch;
