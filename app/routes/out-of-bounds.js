/**********************************************************
 * Out of bounds - 2025-06-02                             *
***********************************************************/

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/out-of-bounds')

const path = require("path");

const version = '/out-of-bounds';

const { queryDatasette, getOrg, getDataset, getJsonResponse } = require('./functions.js');

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

  const outOfBoundsQuery= {
    sql: `select * from expectation
      where
        "name" = :p0
        and "organisation" = :p1
        and "dataset" = :p2`,
    p0: 'Check no entities are outside of the local planning authority boundary',
    p1: res.locals.organisation.organisation,
    p2: res.locals.dataset.dataset,
    _shape: 'objects'
  }

  const outOfBoundsResults = await queryDatasette(outOfBoundsQuery);

  if (outOfBoundsResults.rows && outOfBoundsResults.rows.length > 0) {    
    const OutOfBoundsDetails = JSON.parse(outOfBoundsResults.rows[0].details);
    res.locals.outOfBoundsEntities = OutOfBoundsDetails.entities || [];    
  } else {
    res.locals.outOfBoundsEntities = [];
  }
  res.locals.outOfBoundsCount = res.locals.outOfBoundsEntities.length;
  
  res.render("/out-of-bounds/dataset-details");
})

router.get("/organisations/:orgId/:datasetId/tasklist", async (req, res) => {  
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);

  const outOfBoundsQuery= {
    sql: `select * from expectation
      where
        "name" = :p0
        and "organisation" = :p1
        and "dataset" = :p2`,
    p0: 'Check no entities are outside of the local planning authority boundary',
    p1: res.locals.organisation.organisation,
    p2: res.locals.dataset.dataset,
    _shape: 'objects'
  }

  const outOfBoundsResults = await queryDatasette(outOfBoundsQuery);

  if (outOfBoundsResults.rows && outOfBoundsResults.rows.length > 0) {    
    const OutOfBoundsDetails = JSON.parse(outOfBoundsResults.rows[0].details);
    res.locals.outOfBoundsEntities = OutOfBoundsDetails.entities || [];    
  } else {
    res.locals.outOfBoundsEntities = [];
  }
  res.locals.outOfBoundsCount = res.locals.outOfBoundsEntities.length;

  res.render("/out-of-bounds/tasklist");
})
