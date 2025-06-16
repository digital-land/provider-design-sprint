/******************************************/
/*  Integrated submit — 8 January 2024    */
/******************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/submit-dataset');

const version = '/submit-dataset';

const { queryDatasette, getOrg, getDataset, getJsonResponse, convertToCSV } = require('./functions.js');

router.get("/organisations/:orgId/:datasetId", (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/get-started", locals);
})

router.get("/organisations/:orgId/:datasetId/lpa-details", (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/lpa-details", locals);
})

router.get("/organisations/:orgId/:datasetId/endpoint-details", (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/endpoint-details", locals);
})

router.get("/organisations/:orgId/:datasetId/check-answers", (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/check-answers", locals);
})

router.get("/organisations/:orgId/:datasetId/confirmation", (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/confirmation", locals);
})