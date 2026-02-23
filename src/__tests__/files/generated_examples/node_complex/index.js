// Copyright © 2026 Rutgers, the State University of New Jersey. All rights reserved except as defined by the Rutgers Non-Commercial License, included with this software.
const axios = require('axios');
const _ = require('lodash');

async function fetchData() {
  try {
    const response = await axios.get('https://api.github.com');
    console.log(_.keys(response.data));
  } catch (error) {
    console.error(error);
  }
}

fetchData();
