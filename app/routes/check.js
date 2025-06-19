/**********************************************************
 * Integrated Check — 2024-10                             *
***********************************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/check');
const asyncHandler = require('express-async-handler');

const { getOrg, getDataset } = require('./functions.js');

router.get("/:orgId/:datasetId/choose-upload",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/choose-upload", locals);
}))

router.get("/:orgId/:datasetId/upload-data",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/upload-data", locals);
}))

router.get("/:orgId/:datasetId/checking-file",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/checking-file", locals);
}))

router.get("/:orgId/:datasetId/results",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/results", locals);
}))

router.get("/:orgId/:datasetId/errors",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/errors", locals);
}))

router.get("/:orgId/:datasetId/confirmation",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/confirmation", locals);
}))