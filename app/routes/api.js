const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/api')

const version = '/api'

const { queryDatasette, getOrg, getDataset, getJsonResponse } = require('./functions.js');

router.get("/:orgId/:datasetId/data.geojson", async (req, res) => {
  const organisation = getOrg(req.params.orgId);
  const dataset = getDataset(req.params.datasetId);

  const lpaEntitiesUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ dataset.dataset }&organisation_entity=${ organisation.entity }&limit=500`;
  const lpaEntities = await getJsonResponse(lpaEntitiesUrl);
  
  res.json(lpaEntities);
})

router.get("/:orgId/:datasetId/alternative-sources.geojson", async (req, res) => {
  const organisation = getOrg(req.params.orgId);
  const dataset = getDataset(req.params.datasetId);

  const lpaEntitiesUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ dataset.dataset }&organisation_entity=${ organisation.entity }&limit=500`;
  const allEntitiesUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ dataset.dataset }&geometry_curie=statistical-geography:${ organisation.statistical_geography }&limit=500`;
  
  const lpaEntities = await getJsonResponse(lpaEntitiesUrl);
  const allEntites = await getJsonResponse(allEntitiesUrl);

  const alternativeEntities = { type: "FeatureCollection", features: [] }

  if (allEntites && allEntites.features && lpaEntities && lpaEntities.features) {
    const lpaEntitySet = new Set(lpaEntities.features.map(f => f.properties.entity));
    alternativeEntities.features = allEntites.features.filter(feature => !lpaEntitySet.has(feature.properties.entity));
  }

  res.json(alternativeEntities);
})

router.get("/:orgId/boundary.geojson", async (req, res) => {
  const organisation = getOrg(req.params.orgId);

  const boundaryGeoJsonUrl = `http://submit.planning.data.gov.uk/api/lpa-boundary/${ organisation.organisation }`
  const boundaryGeoJsonObject = await getJsonResponse(boundaryGeoJsonUrl);

  res.json(boundaryGeoJsonObject);
})

router.get("/entity/:entityId.:format", async (req, res) => {
  const entityUrl = `https://www.planning.data.gov.uk/entity/${ req.params.entityId }.${ req.params.format}`;
  console.log(`Fetching entity from: ${entityUrl}`);
  const entityObject = await getJsonResponse(entityUrl); 

  res.json(entityObject);
})
