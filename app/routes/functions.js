/**********************************************************
 * Common functions                                       *
***********************************************************/

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

function getOrg(orgId) {
  const organisations = require("../data/organisations.json");
  return organisations.find(
    (x) => x.organisation == orgId
  );
}

function getDataset(datasetId) {
  const datasets = require("../data/datasets.json");
  return datasets.find((x) => x.dataset == datasetId);
}

function convertToCSV(arr) {
  const array = [Object.keys(arr[0])].concat(arr)

  return array.map(it => {
    return Object.values(it).toString()
  }).join('\n')
}

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
