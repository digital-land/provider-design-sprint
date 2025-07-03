/**********************************************************
 * Walkthrough - 2025-07-02                               *
***********************************************************/

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/walkthrough')
const asyncHandler = require('express-async-handler');

const path = require("path");
const version = '/walkthrough';

const { queryDatasette, getOrg, getDataset, getJsonResponse } = require('./functions.js');
const { createGOVUKPagination } = require('govuk-pagination-module');

// Landing
router.get(["/", "/start"],asyncHandler(async (req, res) => {
  res.locals.version_path = version;
  res.locals.govukRebrand = true; // Use new branding for the walkthrough
  console.log("govukRebrand", res.locals.govukRebrand);
  res.render("/common/landing");
}))

// Choose organisation
router.get("/organisations",asyncHandler(async (req, res) => {
  res.locals.version_path = version;
  res.locals.govukRebrand = true;
  
  res.locals.organisations = require("../data/organisations.json");
  res.locals.alphabetisedOrgs = {};
  let currLetter = "";

  for (const org in locals.organisations) {
    if (Object.hasOwnProperty.call(locals.organisations, org)) {
      const thisOrg = res.locals.organisations[org];
      let firstLetter = thisOrg.name[0];

      if (firstLetter != currLetter) {
        currLetter = firstLetter;
        res.locals.alphabetisedOrgs[currLetter] = [];
      }

      res.locals.alphabetisedOrgs[currLetter].push(thisOrg);
    }
  }

  res.render("/common/organisations");
}))

// LPA overview
router.get("/organisations/:orgId",asyncHandler(async (req, res) => {
  res.locals.version_path = version;
  res.locals.newBranding = true;
  res.locals.organisation = getOrg(req.params.orgId);
  
  const orgSlug = req.params.orgId.replace(/:/, "_");
  const orgPath = path.join(__dirname, `../data/${orgSlug}/datasets.json`);

  if (fs.existsSync(orgPath)) {
    res.locals.datasets = require(orgPath);
  } else {
    res.locals.datasets = require('../data/default/datasets.json');
  }

  res.locals.datasetCount = locals.datasets.length;
  res.locals.datasetsSubmitted = locals.datasets.filter(
    (row) => row.status != "not-submitted"
  ).length;
  res.locals.datasetErrors = locals.datasets.filter(
    (row) => row.status == "error"
  ).length;
  res.locals.datasetIssues = locals.datasets.filter(
    (row) => row.issue_count > 0
  ).length;

  res.locals.statutoryDatasets = locals.datasets.filter(
    (row) => row.provision == "statutory"
  );

  res.locals.odpDatasets = locals.datasets.filter(
    (row) => row.provision == "odp"
  );

  res.render("/common/lpa-overview");
}))

// Dataset details

// Dataset table

// Dataset record detail

// Tasklist

// Issue table

// Issue detail

// Check flow

// Provide flow

// Review alternative sources


router.get("/organisations/:orgId/:datasetId/overview",asyncHandler(async (req, res) => {  
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
}))

router.get("/organisations/:orgId/:datasetId/table",asyncHandler(async (req, res) => {  
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);

  const columnsQuery = {
    sql: `select distinct field
      from column_field
      where field != "IGNORE"
      order by rowid`,
    _shape: 'array'
  }

  res.locals.columns = await queryDatasette(columnsQuery, res.locals.dataset.dataset);

  const entitiesQuery = {
    sql: `select *
      from entity
      where organisation_entity = :p0
      order by reference`,
    p0: res.locals.organisation.entity,
    _shape: 'objects'
  }

  const entitiesResults = await queryDatasette(entitiesQuery, res.locals.dataset.dataset); 

  // Parse the json property of each item and add the parsed properties to the item
  if (entitiesResults.rows) {
    entitiesResults.rows.forEach(item => {
      if (item.json) {
        try {
          const parsed = JSON.parse(item.json);
          Object.assign(item, parsed);
        } catch (e) {
          console.error('Failed to parse item.json:', e, item.json);
        }
      }
      // Change underscores in property names to hyphens
      Object.keys(item).forEach(key => {
        if (key.includes('_')) {
          const newKey = key.replace(/_/g, '-');
          item[newKey] = item[key];
          delete item[key];
        }
      });
    });
  }

  res.locals.datasetEntities = entitiesResults.rows || [];

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

  res.render("/out-of-bounds/dataset-table");
}))

router.get("/organisations/:orgId/:datasetId/detail/:entityId",asyncHandler(async (req, res) => {
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);

  const entitySql = {
    sql: `SELECT * FROM entity WHERE entity = :p0`,
    p0: req.params.entityId,
    _shape: 'objects'
  }
  
  const entityResponse = await queryDatasette(entitySql, res.locals.dataset.dataset, 'json');

  if (entityResponse.rows && entityResponse.rows.length > 0) {
    // Parse the json property of each item and add the parsed properties to the item
    if (entityResponse.rows) {
      entityResponse.rows.forEach(item => {
        if (item.json) {
          try {
            const parsed = JSON.parse(item.json);
            Object.assign(item, parsed);
          } catch (e) {
            console.error('Failed to parse item.json:', e, item.json);
          }
        }
        // Change underscores in property names to hyphens
        Object.keys(item).forEach(key => {
          if (key.includes('_')) {
            const newKey = key.replace(/_/g, '-');
            item[newKey] = item[key];
            delete item[key];
          }
        });
      });
    }

    res.locals.entity = entityResponse.rows[0];

    // Get all entities from this dataset for pagination
    const allEntitiesQuery = {
      sql: `SELECT entity FROM entity WHERE organisation_entity = :p0 ORDER BY reference`,
      p0: res.locals.organisation.entity,
      _shape: 'objects'
    }
    const allEntitiesResults = await queryDatasette(allEntitiesQuery, res.locals.dataset.dataset);
    res.locals.allEntities = allEntitiesResults.rows || [];

    // Find the index of the current entity in the allEntities array
    res.locals.currentEntityIndex = res.locals.allEntities.findIndex(e => e.entity == req.params.entityId);
  } else {
    res.locals.entity = null;
  }

  const pageNum = res.locals.currentEntityIndex + 1 || 1;
  const pathBase = `${version}/organisations/${res.locals.organisation.organisation}/${res.locals.dataset.dataset}/detail/`
  const hrefArray = res.locals.allEntities.map(e => pathBase + e.entity);

  const paginationObj = createGOVUKPagination(pageNum, { hrefArray: hrefArray })
  res.locals.pagination_obj = paginationObj;

  // get column names for the table
  const columnsQuery = {
    sql: `select distinct field
      from column_field
      where field != "IGNORE"
      order by rowid`,
    _shape: 'array'
  }

  res.locals.columns = await queryDatasette(columnsQuery, res.locals.dataset.dataset);

  res.render("/out-of-bounds/entity-detail");
}))

router.get("/organisations/:orgId/:datasetId/tasklist",asyncHandler(async (req, res) => {  
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

  res.render("/out-of-bounds/tasklist");
}))

router.get("/organisations/:orgId/:datasetId/issue-table",asyncHandler(async (req, res) => {
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

  const columnsQuery = {
    sql: `select distinct field
      from column_field
      where field != "IGNORE"
      order by rowid`,
    _shape: 'array'
  }

  res.locals.columns = await queryDatasette(columnsQuery, res.locals.dataset.dataset);
  // Only select entities that are in outOfBoundsEntities
  let entitiesQuery;
  if (res.locals.outOfBoundsEntities.length > 0) {
    // Use parameterized query for safety
    const placeholders = res.locals.outOfBoundsEntities.map((_, i) => `:id${i}`).join(', ');
    entitiesQuery = {
      sql: `select *
        from entity
        where entity in (${placeholders})
        order by reference`,
      ...Object.fromEntries(res.locals.outOfBoundsEntities.map((id, i) => [`id${i}`, id])),
      _shape: 'objects'
    }
  } else {
    // No out of bounds entities, return empty result
    entitiesQuery = {
      sql: `select * from entity where 1=0`,
      _shape: 'objects'
    }
  }

  const entitiesResults = await queryDatasette(entitiesQuery, res.locals.dataset.dataset); 

  // Parse the json property of each item and add the parsed properties to the item
  if (entitiesResults.rows) {
    entitiesResults.rows.forEach(item => {
      if (item.json) {
        try {
          const parsed = JSON.parse(item.json);
          Object.assign(item, parsed);
        } catch (e) {
          console.error('Failed to parse item.json:', e, item.json);
        }
      }
      // Change underscores in property names to hyphens
      Object.keys(item).forEach(key => {
        if (key.includes('_')) {
          const newKey = key.replace(/_/g, '-');
          item[newKey] = item[key];
          delete item[key];
        }
      });
    });
  }

  res.locals.datasetEntities = entitiesResults.rows || [];
  res.locals.entityCount = res.locals.datasetEntities.length;

  res.render("/out-of-bounds/issue-table");
}))

router.get("/organisations/:orgId/:datasetId/issue-detail/:entityId",asyncHandler(async (req, res) => {
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);

  const entitySql = {
    sql: `SELECT * FROM entity WHERE entity = :p0`,
    p0: req.params.entityId,
    _shape: 'objects'
  }
  
  const entityResponse = await queryDatasette(entitySql, res.locals.dataset.dataset, 'json');

  if (entityResponse.rows && entityResponse.rows.length > 0) {
    // Parse the json property of each item and add the parsed properties to the item
    if (entityResponse.rows) {
      entityResponse.rows.forEach(item => {
        if (item.json) {
          try {
            const parsed = JSON.parse(item.json);
            Object.assign(item, parsed);
          } catch (e) {
            console.error('Failed to parse item.json:', e, item.json);
          }
        }
        // Change underscores in property names to hyphens
        Object.keys(item).forEach(key => {
          if (key.includes('_')) {
            const newKey = key.replace(/_/g, '-');
            item[newKey] = item[key];
            delete item[key];
          }
        });
      });
    }

    res.locals.entity = entityResponse.rows[0];

    // Get out of bounds entities from this dataset for pagination
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

    // Find the index of the current entity in the allEntities array
    res.locals.currentEntityIndex = res.locals.outOfBoundsEntities.findIndex(e => e == req.params.entityId);
  } else {
    res.locals.entity = null;
  }

  const pageNum = res.locals.currentEntityIndex + 1 || 1;
  const pathBase = `${version}/organisations/${res.locals.organisation.organisation}/${res.locals.dataset.dataset}/issue-detail/`
  const hrefArray = res.locals.outOfBoundsEntities.map(e => pathBase + e);

  const paginationObj = createGOVUKPagination(pageNum, { hrefArray: hrefArray })
  res.locals.pagination_obj = paginationObj;

  // get column names for the table
  const columnsQuery = {
    sql: `select distinct field
      from column_field
      where field != "IGNORE"
      order by rowid`,
    _shape: 'array'
  }

  res.locals.columns = await queryDatasette(columnsQuery, res.locals.dataset.dataset);

  res.render("/out-of-bounds/issue-detail");
}))