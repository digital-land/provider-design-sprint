const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/api')

const version = '/api'

const { queryDatasette, getOrg, getDataset, getJsonResponse } = require('./functions.js');

router.get("/:orgId/:datasetId/data.geojson", async (req, res) => {
  const organisation = getOrg(req.params.orgId);
  const dataset = getDataset(req.params.datasetId);

  const lpaEntitiesUrl = `https://www.planning.data.gov.uk/entity.geojson?dataset=${ dataset.dataset }&organisation_entity=${ organisation.entity }&limit=500`;
  const lpaEntities = await getJsonResponse(lpaEntitiesUrl);

  const outOfBoundsQuery= {
    sql: `select * from expectation
      where
        "name" = :p0
        and "organisation" = :p1
        and "dataset" = :p2`,
    p0: 'Check no entities are outside of the local planning authority boundary',
    p1: organisation.organisation,
    p2: dataset.dataset,
    _shape: 'objects'
  }

  const outOfBoundsResults = await queryDatasette(outOfBoundsQuery);
  let outOfBoundsEntities = []
  
  if (outOfBoundsResults.rows && outOfBoundsResults.rows.length > 0) {    
    const outOfBoundsDetails = JSON.parse(outOfBoundsResults.rows[0].details);
    outOfBoundsEntities = outOfBoundsDetails.entities || [];
  }

  // Remove out of bounds entities from lpaEntities using the entity property as a key
  if (lpaEntities && lpaEntities.features && outOfBoundsEntities.length > 0) {
    const outOfBoundsSet = new Set(outOfBoundsEntities);
    
    lpaEntities.features = lpaEntities.features.filter(
      feature => !outOfBoundsSet.has(feature.properties.entity)
    );
  }

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
  const entityObject = await getJsonResponse(entityUrl); 

  res.json(entityObject);
})

router.get("/:orgId/:datasetId/out-of-bounds.geojson", async (req, res) => {
  const organisation = getOrg(req.params.orgId);
  const dataset = getDataset(req.params.datasetId);

  const outOfBoundsQuery= {
    sql: `select * from expectation
      where
        "name" = :p0
        and "organisation" = :p1
        and "dataset" = :p2`,
    p0: 'Check no entities are outside of the local planning authority boundary',
    p1: organisation.organisation,
    p2: dataset.dataset,
    _shape: 'objects'
  }

  const outOfBoundsResults = await queryDatasette(outOfBoundsQuery);
  let outOfBoundsEntities = []
  
  if (outOfBoundsResults.rows && outOfBoundsResults.rows.length > 0) {    
    const outOfBoundsDetails = JSON.parse(outOfBoundsResults.rows[0].details);
    outOfBoundsEntities = outOfBoundsDetails.entities || [];    
  }

  const outOfBoundsGeoJsonUrl = 'https://www.planning.data.gov.uk/entity.geojson?entity=' + outOfBoundsEntities.join('&entity=');
  const outOfBoundsGeoJson = await getJsonResponse(outOfBoundsGeoJsonUrl);

  res.json(outOfBoundsGeoJson);
})

router.get("/os/get-access-token", async (req, res) => { 
  const osAccessTokenUrl = `https://submit.planning.data.gov.uk/api/os/get-access-token`;
  const osAccessToken = await getJsonResponse(osAccessTokenUrl);

  res.json(osAccessToken);
})
