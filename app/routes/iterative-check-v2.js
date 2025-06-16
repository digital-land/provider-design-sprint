/**********************************************************
 * Iterative Check v2 — 2025-01-14                        *
***********************************************************/
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/iterative-check-v2')
const fs = require("fs");

const path = require("path");

const version = '/iterative-check-v2';

const { queryDatasette, getOrg, getDataset, getJsonResponse, convertToCSV } = require('./functions.js');

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

  console.log(locals.organisation)
  
  const orgSlug = req.params.orgId.replace(/:/, "_");
  const orgPath = path.join(__dirname, `../data/${orgSlug}/datasets.json`);

  if (fs.existsSync(orgPath)) {
    locals.datasets = require(orgPath);
  } else {
    const datasetQuery = {
      sql: `SELECT
              d.name,
              p.dataset,
              CASE
                WHEN (rle.endpoint is null) THEN 'not-submitted'
                WHEN (rle.status != '200') THEN 'error'
                WHEN COUNT(
                  CASE
                    WHEN it.severity == 'error' THEN 1
                    ELSE null
                  END
                ) > 0 THEN 'needs-fixing'
                ELSE 'live'
              END AS status,
              COUNT(
                CASE
                  WHEN it.severity == 'error' THEN 1
                  ELSE null
                END
              ) AS issue_count,
              rle.status AS http_status,
              p.provision_reason,
              CASE
                WHEN (p.provision_rule LIKE '%ODP%') THEN 'odp'
              END as provision
            FROM
              provision p
              LEFT JOIN organisation o ON o.organisation = p.organisation
              LEFT JOIN reporting_latest_endpoints rle ON REPLACE(rle.organisation, '-eng', '') = p.organisation
              AND rle.pipeline = p.dataset
              LEFT JOIN issue i ON rle.resource = i.resource
              AND rle.pipeline = i.dataset
              LEFT JOIN issue_type it ON i.issue_type = it.issue_type
              INNER JOIN dataset d ON d.dataset = p.dataset
            WHERE
              p.organisation = :p0
              AND p.provision_reason IN ('expected', 'statutory')
            GROUP BY
              p.organisation,
              p.dataset,
              o.name,
              rle.pipeline,
              rle.endpoint
            ORDER BY
              p.dataset
            `,
      p0: req.params.orgId,
      _shape: 'objects'
    }

    const datasetResponse = await queryDatasette(datasetQuery);
    locals.datasets = datasetResponse.rows
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

  res.render("/check-iterative-v2/lpa-overview", locals);
})

router.get("/organisations/:orgId/:datasetId/overview", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId, true);
  console.log(locals.organisation)
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

  // const boundaryResponse = await getBoundaryGeoJson(req.params.orgId);
  // locals.boundary_geojson = JSON.stringify(boundaryResponse);

  res.render("/check-iterative-v2/dataset-details", locals);
})

router.get("/organisations/:orgId/:datasetId/get-started", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/get-started", locals);
})

router.get("/organisations/:orgId/:datasetId/choose-upload", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/choose-upload", locals);
})

router.get("/organisations/:orgId/:datasetId/upload-data", async (req, res) => {
  if (req.session.data['upload_method'] == "url") {
    const url = `/iterative-check-v2/organisations/${req.params.orgId}/${req.params.datasetId}/endpoint-details`
    res.redirect(url)
  } else {
    const locals = {};
    locals.version_path = version;
    locals.organisation = getOrg(req.params.orgId);
    locals.dataset = getDataset(req.params.datasetId);

    res.render("/check-iterative-v2/upload-data", locals);
  }
})

router.get("/organisations/:orgId/:datasetId/endpoint-details", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/endpoint-details", locals);
})


router.get("/organisations/:orgId/:datasetId/checking-file", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/checking-file", locals);
})

router.get("/organisations/:orgId/:datasetId/results", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/results-blocked", locals);
})

router.get("/organisations/:orgId/:datasetId/results-non-blocked", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/results-non-blocked", locals);
})

router.get("/organisations/:orgId/:datasetId/issue-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/issue-detail-blocking", locals);
})

router.get("/organisations/:orgId/:datasetId/issue-non-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/issue-detail-non-blocking", locals);
})

router.get("/organisations/:orgId/:datasetId/share-results", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/share-results", locals);
})

router.get("/organisations/:orgId/:datasetId/share-confirmation", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/share-confirmation", locals);
})

router.get("/organisations/:orgId/:datasetId/confirmation", async (req, res) => {
  const locals = {};
  locals.version_path = version;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/confirmation", locals);
})