/**********************************************************
 * Expectations checks - 2025-02-10                       *
***********************************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/expectations')
const asyncHandler = require('express-async-handler');
const fs = require("fs");

const path = require("path");

const version = '/expectations';

const { queryDatasette, getOrg, getDataset, getJsonResponse, convertToCSV } = require('./functions.js');

router.get(["/", "/start"],asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;

  res.render("/common/landing", locals);
}))

router.get("/organisations",asyncHandler(async (req, res) => {
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
}))

router.get("/organisations/:orgId",asyncHandler(async (req, res) => {
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
    (row) => row.provision_reason == "statutory"
  );

  locals.odpDatasets = locals.datasets.filter(
    (row) => row.provision_reason == "expected"
  );

  locals.showBrownfieldNotice = locals.datasets.
    find(x => x.dataset === 'brownfield-land').notice

  res.render("/common/lpa-overview", locals);
}))

router.get("/organisations/:orgId/:datasetId/overview",asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  const endpointQuery = {
    sql: `
      select
          rhe.endpoint_url,
          s.documentation_url,
          rhe.licence,
          rhe.status,
          rhe.endpoint_entry_date as date_added,
          rhe.latest_log_entry_date as last_accessed,
          rhe.resource_start_date as last_updated
        from
          reporting_historic_endpoints rhe
        join source s on s.endpoint = rhe.endpoint
        where
          rhe.pipeline = :p0
          and rhe.organisation = :p1
          and (rhe.endpoint_end_date == "" OR rhe.endpoint_end_date > date('now'))
        order by
          date_added DESC
        limit
          101
    `,
    p0: req.params.datasetId,
    p1: req.params.orgId,
    _shape: 'objects'
  }

  const endpointResponse = await queryDatasette(endpointQuery);
  locals.endpoints = endpointResponse.rows
  // locals.endpoints = require("../data/endpoints.json");

  res.render("/check-iterative-v2/dataset-details", locals);
}))

router.get("/organisations/:orgId/:datasetId/get-started",asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/expectations/get-started-alternative-sources", locals);
}))

router.get("/organisations/:orgId/:datasetId/get-started-no-alternative-sources",asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/expectations/get-started", locals);
}))

router.get("/organisations/:orgId/:datasetId/review-alternative-sources",asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.conservation_areas = require("../data/alternative-conservation-areas.json");
  locals.conservation_area_count = locals.conservation_areas.length;

  res.render("/expectations/review-alternative-sources", locals);
}))

router.post("/organisations/:orgId/:datasetId/review-handler", (req, res) => {
  const urlSlug = `/expectations/organisations/${req.params.orgId}/${req.params.datasetId}`;

  if (req.session.data['review_actions'] == 'download') {
    req.session.data['all_data'] = 'true';
    res.redirect(`${urlSlug}/download-report`);
  } else if (req.session.data['review_actions'] == 'review') {
    res.redirect(`${urlSlug}/review-record`)
  } else {
    res.status('500').send({
      message: 'Error'
    })
  }
})

router.get("/organisations/:orgId/:datasetId/review-record/:record_index?",asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.conservation_areas = require("../data/alternative-conservation-areas.json");
  locals.conservation_area_count = locals.conservation_areas.length;

  locals.conservation_area_index = req.params.record_index
  if (locals.conservation_area_index == null) {
    locals.conservation_area_index = 0;
  }

  res.render("/expectations/review-record", locals);
}))

router.get("/organisations/:orgId/:datasetId/download-report",asyncHandler(async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.conservation_areas = require("../data/alternative-conservation-areas.json");
  locals.conservation_area_count = locals.conservation_areas.length;

  locals.selected_ids = [];
  locals.selected_areas = [];

  if (req.session.data['all_data'] == 'true') {
    locals.selected_areas = locals.conservation_areas
  } else {
    Object.entries(req.session.data).forEach(([key, value]) => {
      if (key.includes('review_record') && value == 'true') {
        const id = key.match(/\d+/)[0]
        locals.selected_ids.push(id)
        locals.selected_areas.push(locals.conservation_areas[id])
      }
    })
  }

  if (locals.selected_areas.length > 0) {
    locals.download_geojson = JSON.stringify(locals.selected_areas, null, 2);
    locals.download_csv = convertToCSV(locals.selected_areas);
  } else {
    locals.download_geojson = "";
    locals.download_csv = "";
  }
  
  res.render("/expectations/download-report", locals);
}))

router.get('/expectations/organisations/:orgId/:datasetId/download-file',asyncHandler(async (req, res) => {
  const conservation_areas = require("../data/alternative-conservation-areas.json");

  const selected_ids = [];
  const selected_areas = [];
  Object.entries(req.session.data).forEach(([key, value]) => {
    if (key.includes('review_record') && value == 'true') {
      const id = key.match(/\d+/)[0]
      selected_ids.push(id)
      selected_areas.push(conservation_areas[id])
    }
  })
  
  let download_file = "";
  let filename = "";
  if (req.session.data['download_format'] == "csv") {
    download_file = convertToCSV(selected_areas);  
    filename = "conservations_areas.csv";
  } else if (req.session.data['download_format'] == "geojson") {
    download_file = JSON.stringify(selected_areas, null, 2);
    filename = "conservation_areas.json";
  }

  res.set({"Content-Disposition":`attachment; filename="${filename}"`});
  res.send(download_file);
}))