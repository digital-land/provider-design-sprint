/**********************************************************
 * Common functions                                       *
***********************************************************/

/**
 * Queries the Planning Data Datasette API
 * @param {Object} queryObj - The query object containing SQL and parameters
 * @param {string} [database='digital-land'] - The database to query
 * @param {string} [format='json'] - The response format
 * @returns {Promise<Object>} The JSON response from the API
 * @throws {Error} When the API request fails
 */
async function queryDatasette(queryObj, database='digital-land', format='json') {
  const apiUrl = `https://datasette.planning.data.gov.uk/${database}.${format}?` + new URLSearchParams(queryObj);

  const response = await fetch(apiUrl).catch(e => console.error(e));

  if (response.status != 200) {
    console.error(response)
  } else {
    const json = await response.json();
    return json
  }
}

/**
 * Finds an organisation by its ID
 * @param {string} orgId - The organisation ID to search for
 * @param {Object} [res] - Express response object for HTTP error handling
 * @returns {Object|undefined} The organisation object if found, undefined otherwise
 * @throws {Error} When organisation is not found and res parameter is not provided
 */
function getOrg(orgId, next) {
  const organisations = require("../data/organisations.json");
  const org = organisations.find((x) => x.organisation == orgId);

  if (!org) {
    throw new Error("Organisation not found");
  } else {
    return org;
  }
}

/**
 * Finds a dataset by its ID
 * @param {string} datasetId - The dataset ID to search for
 * @param {Object} [res] - Express response object for HTTP error handling
 * @returns {Object|undefined} The dataset object if found, undefined otherwise
 * @throws {Error} When dataset is not found and res parameter is not provided
 */
function getDataset(datasetId, res) {
  const datasets = require("../data/datasets.json");
  const dataset = datasets.find((x) => x.dataset == datasetId);
  if (!dataset) {
    if (res) {
      res.sendStatus(404).send("Dataset not found");
      next();
    }
    throw new Error("Dataset not found");
  }
  return dataset;
}

/**
 * Converts an array of objects to CSV format
 * @param {Array<Object>} arr - Array of objects to convert
 * @returns {string} CSV formatted string with headers
 */
function convertToCSV(arr) {
  const array = [Object.keys(arr[0])].concat(arr)

  return array.map(it => {
    return Object.values(it).toString()
  }).join('\n')
}

/**
 * Fetches and parses JSON from a URL
 * @param {string} url - The URL to fetch JSON from
 * @returns {Promise<Object>} The parsed JSON response
 * @throws {Error} When the fetch request fails or returns non-200 status
 */
const getJsonResponse = async (url) => {
  const response = await fetch(url).catch(e => console.error(e));

  if (response.status != 200) {
    console.error(response)
  } else {
    const json = await response.json();
    return json
  }
}

module.exports = { queryDatasette, getOrg, getDataset, convertToCSV, getJsonResponse };
