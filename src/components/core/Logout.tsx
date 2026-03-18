// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
/**********************************************************************************************************************/
/* Imports
/**********************************************************************************************************************/

/* react imports */
import { useEffect } from 'react';

/**********************************************************************************************************************/

interface IProps {
  handleLogout: () => void;
}

const Logout: React.FC<IProps> = ({ handleLogout }) => {
  useEffect(() => {
    handleLogout();
  }, [handleLogout]);

  return null;
};

export default Logout;
