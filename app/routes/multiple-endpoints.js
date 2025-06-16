/******************************************/
/*  Multiple endpoints — 18 December 2024 */
/******************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/multiple-endpoints');

const version = '/multiple-endpoints';

const { getOrg, getDataset } = require('./functions.js');

router.get("/organisations/:orgId/:datasetId", (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.endpoints = require("../data/endpoints.json");

  res.render("/multiple-endpoints/dataset-details", locals);
})
