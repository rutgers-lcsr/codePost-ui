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
