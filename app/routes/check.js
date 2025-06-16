/**********************************************************
 * Integrated Check — 2024-10                             *
***********************************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/check');

const { getOrg, getDataset } = require('./functions.js');

router.get("/:orgId/:datasetId/choose-upload", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/choose-upload", locals);
})

router.get("/:orgId/:datasetId/upload-data", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/upload-data", locals);
})

router.get("/:orgId/:datasetId/checking-file", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/checking-file", locals);
})

router.get("/:orgId/:datasetId/results", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/results", locals);
})

router.get("/:orgId/:datasetId/errors", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/errors", locals);
})

router.get("/:orgId/:datasetId/confirmation", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/confirmation", locals);
})