const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/alternative-sources')

const path = require("path");

const version = '/alternative-sources'

const { queryDatasette, getOrg, getDataset, getJsonResponse } = require('./functions.js');

/**********************************************************
 * alternative-sources - 2025-05-20                       *
***********************************************************/

router.get("/organisations/:orgId/:datasetId/overview", async (req, res) => {
  
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);
  res.locals.endpoints = require(path.join(__dirname, "../data/endpoint-single.json"));

  const lpaEntitiesUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ res.locals.dataset.dataset }&organisation_entity=${ res.locals.organisation.entity }&limit=500`;
  const allEntitiesUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ res.locals.dataset.dataset }&geometry_curie=statistical-geography:${ res.locals.organisation.statistical_geography }&limit=500`;
  
  res.locals.lpaEntities = await getJsonResponse(lpaEntitiesUrl);
  
  const allEntites = await getJsonResponse(allEntitiesUrl);
  res.locals.alternativeEntities = { type: "FeatureCollection", features: [] }
  if (allEntites && allEntites.features && res.locals.lpaEntities && res.locals.lpaEntities.features) {
    const lpaEntitySet = new Set(res.locals.lpaEntities.features.map(f => f.properties.entity));
    res.locals.alternativeEntities.features = allEntites.features.filter(feature => !lpaEntitySet.has(feature.properties.entity));
  }

  res.locals.entitiesCount = res.locals.lpaEntities.features.length;
  res.locals.alternativeEntitiesCount = res.locals.alternativeEntities.features.length;
  
  res.render("/alternative-sources/dataset-details");
})

router.get("/organisations/:orgId/:datasetId/review-alternative-sources", async (req, res) => {
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);

  res.render("/alternative-sources/review-alternative-sources");
})
