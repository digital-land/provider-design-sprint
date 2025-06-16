/**********************************************************
 * Iterative Check research routes — 2024-12-09           *
***********************************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/iterative-check');

const fs = require("fs");
const path = require("path");

const version = '/iterative-check';

const { queryDatasette, getOrg, getDataset } = require('./functions.js');

router.get(["/", "/start"], async (req, res) => {
  const locals = {};
  locals.version_path = version;

  res.render("/common/landing", locals);
})

router.get("/organisations", async (req, res) => {
  const locals = {};
  locals.version_path = version;

  locals.organisations = require("../data/organisations.json");
  locals.alphabetisedOrgs = {};
  let currLetter = "";

  for (const org in locals.organisations) {
    if (Object.hasOwnProperty.call(locals.organisations, org)) {
      const thisOrg = locals.organisations[org];
      let firstLetter = thisOrg.name[0];

      if (firstLetter != currLetter) {
        currLetter = firstLetter;
        locals.alphabetisedOrgs[currLetter] = [];
      }

      locals.alphabetisedOrgs[currLetter].push(thisOrg);
    }
  }

  res.render("/common/organisations", locals);
})

router.get("/organisations/:orgId", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  
  const orgSlug = req.params.orgId.replace(/:/, "_");
  const orgPath = path.join(__dirname, `../data/${orgSlug}/datasets.json`);

  if (fs.existsSync(orgPath)) {
    locals.datasets = require(orgPath);
  } else {
    locals.datasets = require('../data/default/datasets.json');
  }

  locals.datasetCount = locals.datasets.length;
  locals.datasetsSubmitted = locals.datasets.filter(
    (row) => row.status != "not-submitted"
  ).length;
  locals.datasetErrors = locals.datasets.filter(
    (row) => row.status == "error"
  ).length;
  locals.datasetIssues = locals.datasets.filter(
    (row) => row.issue_count > 0
  ).length;

  locals.statutoryDatasets = locals.datasets.filter(
    (row) => row.provision == "statutory"
  );

  locals.odpDatasets = locals.datasets.filter(
    (row) => row.provision == "odp"
  );

  res.render("/check-iterative/lpa-overview", locals);
})

router.get("/organisations/:orgId/:datasetId", (req, res) => {
  res.redirect(`/iterative-check/organisations/${req.params.orgId}/${req.params.datasetId}/get-started`);
})

router.get("/organisations/:orgId/:datasetId/get-started", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/get-started", locals);
})

router.get("/organisations/:orgId/:datasetId/choose-upload", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/choose-upload", locals);
})

router.get("/organisations/:orgId/:datasetId/upload-data", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/upload-data", locals);
})

router.get("/organisations/:orgId/:datasetId/checking-file", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/checking-file", locals);
})

router.get("/organisations/:orgId/:datasetId/results", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/results-blocked", locals);
})

router.get("/organisations/:orgId/:datasetId/results-non-blocked", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/results-non-blocked", locals);
})

router.get("/organisations/:orgId/:datasetId/issue-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/issue-detail-blocking", locals);
})

router.get("/organisations/:orgId/:datasetId/issue-non-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/issue-detail-non-blocking", locals);
})

router.get("/organisations/:orgId/:datasetId/check-data", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/check-data", locals);
})

router.get("/organisations/:orgId/:datasetId/confirmation", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/confirmation", locals);
})
