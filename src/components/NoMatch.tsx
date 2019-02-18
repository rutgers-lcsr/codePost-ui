import * as React from 'react';
import { Button } from 'react-md';

const NoMatch = () => {
  return (
    <div className="error-page">
      <img className="error-page__image" src={require('../img/404_error.png')} />
      <Button href="/login" key="Login" className="error-page__button" flat={true} />
    </div>
  );
};

export default NoMatch;
