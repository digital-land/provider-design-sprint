const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/alternative-sources')

const fs = require("fs");
const path = require("path");

const version = '/alternative-sources'

const { queryDatasette, getOrg, getDataset, convertToCSV } = require('./functions.js');
const { get } = require('request');

/**********************************************************
 * alternative-sources - 2025-05-20                       *
***********************************************************/

router.get("/organisations/:orgId/:datasetId/overview", async (req, res) => {
  
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);
  res.locals.endpoints = []

  const geoJsonUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ res.locals.dataset.dataset }&geometry_curie=statistical-geography:${ res.locals.organisation.statistical_geography }&limit=500`;
  console.log(geoJsonUrl)
  res.locals.geoJsonObject = await getJsonResponse(geoJsonUrl);

  const boundaryGeoJsonUrl = `http://submit.planning.data.gov.uk/api/lpa-boundary/${ res.locals.organisation.organisation }`
  res.locals.boundaryGeoJsonObject = await getJsonResponse(boundaryGeoJsonUrl);
  
  res.render("/alternative-sources/dataset-details");
})

const getJsonResponse = async (url) => {
  const response = await fetch(url).catch(e => console.error(e));

  if (response.status != 200) {
    console.error(response)
  } else {
    const json = await response.json();
    return json
  }
}
