const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/alternative-sources')

const fs = require("fs");
const path = require("path");

const version = '/alternative-sources'

const { queryDatasette, getOrg, getDataset, convertToCSV } = require('./functions.js')

/**********************************************************
 * alternative-sources - 2025-05-20                       *
***********************************************************/

router.get("/organisations/:orgId/:datasetId/overview", (req, res) => {
  
  res.locals.version_path = version;
  res.locals.organisation = getOrg(req.params.orgId);
  res.locals.dataset = getDataset(req.params.datasetId);
  res.locals.endpoints = []

  res.render("/alternative-sources/dataset-details");
})
