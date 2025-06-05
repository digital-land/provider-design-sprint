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

router.get("/organisations/:orgId/:datasetId/table", async (req, res) => {  
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
});

router.get("/organisations/:orgId/:datasetId/detail/:entityId", async (req, res) => {
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
  const numEntries = res.locals.allEntities.length;

  const paginationObj = {}
  if (pageNum > 1) {
    paginationObj.prevObj = {
      href: version + req.path.replace(/(\d+)/, res.locals.allEntities[pageNum - 1].entity)
    }
  }

  if (pageNum < numEntries) {
    paginationObj.nextObj = {
      href: version + req.path.replace(/(\d+)/, res.locals.allEntities[pageNum + 1].entity)
    }
  }

  paginationObj.items = []
  let prevSkip = false;
  let nextSkip = false;
  for (let i=1; i<=numEntries; i++) {

    if (i == 1
      || (i >= pageNum-2 && i <= pageNum+2)
      || i == numEntries) {
      
      let item = {
        number: i,
        href: version + req.path.replace(/(\d+)/, res.locals.allEntities[i-1].entity)
      }

      if (i == pageNum) item.current = true;
      paginationObj.items.push(item)
    }
    
    if (i > 1 && (i <= pageNum-2) && !prevSkip) {
      let item = {
        ellipsis: true
      }

      paginationObj.items.push(item)
      prevSkip = true
    }
    
    if (i < numEntries && (i >= pageNum+2) && !nextSkip) {
      let item = {
        ellipsis: true
      }

      paginationObj.items.push(item)
      nextSkip = true
    }
  }

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

  res.render("/out-of-bounds/tasklist");
})

router.get("/organisations/:orgId/:datasetId/issue-table", async (req, res) => {
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
})

router.get("/organisations/:orgId/:datasetId/issue-detail/:entityId", async (req, res) => {
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
  const numEntries = res.locals.outOfBoundsEntities.length;

  const paginationObj = {}
  if (pageNum > 1) {
    paginationObj.prevObj = {
      href: version + req.path.replace(/(\d+)/, res.locals.outOfBoundsEntities[pageNum - 2])
    }
  }

  if (pageNum < numEntries) {
    paginationObj.nextObj = {
      href: version + req.path.replace(/(\d+)/, res.locals.outOfBoundsEntities[pageNum])
    }
  }

  paginationObj.items = []
  let prevSkip = false;
  let nextSkip = false;
  for (let i=1; i<=numEntries; i++) {

    if (i == 1
      || (i >= pageNum-2 && i <= pageNum+2)
      || i == numEntries) {
      
      let item = {
        number: i,
        href: version + req.path.replace(/(\d+)/, res.locals.outOfBoundsEntities[i-1])
      }

      if (i == pageNum) item.current = true;
      paginationObj.items.push(item)
    }
    
    if (i > 1 && (i <= pageNum-2) && !prevSkip) {
      let item = {
        ellipsis: true
      }

      paginationObj.items.push(item)
      prevSkip = true
    }
    
    if (i < numEntries && (i >= pageNum+2) && !nextSkip) {
      let item = {
        ellipsis: true
      }

      paginationObj.items.push(item)
      nextSkip = true
    }
  }

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
})