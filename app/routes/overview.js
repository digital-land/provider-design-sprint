// initial dashboard designs
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/overview');
const request = require("request");
const { getOrg, getDataset } = require('./functions.js');


router.get("/start", (req, res) => {
  res.render("/overview/start");
});

router.get("/organisations", (req, res) => {
  const organisations = require("../data/organisations.json");
  let currLetter = "";
  let alphabetisedOrgs = {};

  for (const org in organisations) {
    if (Object.hasOwnProperty.call(organisations, org)) {
      const thisOrg = organisations[org];
      let firstLetter = thisOrg.name[0];

      if (firstLetter != currLetter) {
        currLetter = firstLetter;
        alphabetisedOrgs[currLetter] = [];
      }

      alphabetisedOrgs[currLetter].push(thisOrg);
    }
  }

  res.render("/overview/organisations", { alphabetisedOrgs: alphabetisedOrgs });
});

router.get("/:orgId", (req, res) => {
  let locals = {};
  const organisations = require("../data/organisations.json");
  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );

  res.render("/overview/lpa-overview-list", locals);
});

router.get("/:orgId/v1", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);

  let apiURL = "https://datasette.planning.data.gov.uk/digital-land.json";

  let queryObj = {
    sql: `SELECT
            p.organisation,
            o.name,
            p.dataset,
            d.name AS dataset_name,
            rle.endpoint
          FROM
            provision p
            INNER JOIN organisation o ON o.organisation = p.organisation
            LEFT JOIN reporting_latest_endpoints rle ON REPLACE(rle.organisation, '-eng', '') = p.organisation
            AND rle.pipeline = p.dataset
            INNER JOIN dataset d ON d.dataset = p.dataset
          Where
            p.organisation = :p0
          ORDER BY
            p.organisation,
            o.name`,
    p0: req.params.orgId,
    _shape: "objects",
  };

  let queryString = new URLSearchParams(queryObj).toString();
  let endpoint = `${apiURL}?${queryString}`;

  let lpaData = {};

  request(endpoint, (error, response, body) => {
    if (error) {
      return console.log(error);
    } else if (response.statusCode == 200) {
      lpaData = JSON.parse(body);
      locals.datasets = lpaData.rows;

      locals.datasetCount = locals.datasets.length;
      locals.datasetsSubmitted = locals.datasets.filter(
        (row) => row.endpoint != null
      ).length;

      console.log(locals);

      res.render("/overview/lpa-overview-v1", locals);
    }
  });
});

router.get("/:orgId/v2", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);

  let apiURL = "https://datasette.planning.data.gov.uk/digital-land.json";

  let queryObj = {
    sql: `
SELECT
  p.organisation,
  o.name,
  p.dataset,
  d.name AS dataset_name,
  rle.pipeline,
  rle.endpoint,
  rle.resource,
  rle.exception,
  rle.status AS http_status,
  CASE
    WHEN (rle.status != '200') THEN 'Error'
    WHEN COUNT(
      CASE
        WHEN it.severity == 'error' THEN 1
        ELSE null
      END
    ) > 0 THEN 'Issue'
    ELSE 'No issues'
  END AS status,
  CASE
    WHEN (it.severity = 'info') THEN ''
    ELSE i.issue_type
  END AS issue_type,
  CASE
    WHEN (it.severity = 'info') THEN ''
    ELSE it.severity
  END AS severity,
  it.responsibility,
  COUNT(
    CASE
      WHEN it.severity == 'error' THEN 1
      ELSE null
    END
  ) AS issue_count
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
    _shape: "objects",
  };

  let queryString = new URLSearchParams(queryObj).toString();
  let endpoint = `${apiURL}?${queryString}`;

  let lpaData = {};

  request(endpoint, (error, response, body) => {
    if (error) {
      return console.log(error);
    } else if (response.statusCode == 200) {
      lpaData = JSON.parse(body);
      locals.datasets = lpaData.rows;

      locals.datasetCount = locals.datasets.length;
      locals.datasetsSubmitted = locals.datasets.filter(
        (row) => row.endpoint != null
      ).length;
      locals.datasetErrors = locals.datasets.filter(
        (row) => row.status == "Error"
      ).length;
      locals.datasetIssues = locals.datasets.filter(
        (row) => row.status == "Issue"
      ).length;

      console.log(locals);

      res.render("/overview/lpa-overview-v2", locals);
    }
  });
});

router.get("/:orgId/dataset/:datasetId", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/dataset-details", locals);
});

router.get("/:orgId/dataset/:datasetId/get-started", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/get-started.html", locals);
});

router.get("/:orgId/dataset/:datasetId/tasklist", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  let apiURL = "https://datasette.planning.data.gov.uk/digital-land.json";

  let queryObj = {
    sql: `SELECT
              p.organisation,
              o.name,
              p.dataset,
              d.name as dataset_name,
              rle.endpoint,
              rle.resource,
              rle.exception,
              i.rowid,
              i.field,
              i.issue_type,
              i.line_number,
              i.value,
              i.message,
              it.responsibility,
              it.severity,
              CASE
                WHEN COUNT(
                  CASE
                    WHEN it.severity == 'error' THEN 1
                    ELSE null
                  END
                ) > 0 THEN 'Issue'
                ELSE 'No issues'
              END AS status,
              COUNT(i.issue_type) as num_issues
          FROM
              provision p
          LEFT JOIN
              organisation o ON o.organisation = p.organisation
          LEFT JOIN
              dataset d ON d.dataset = p.dataset
          LEFT JOIN
              reporting_latest_endpoints rle
              ON REPLACE(rle.organisation, '-eng', '') = p.organisation
              AND rle.pipeline = p.dataset
          LEFT JOIN
              issue i ON rle.resource = i.resource AND rle.pipeline = i.dataset
          LEFT JOIN
              issue_type it ON i.issue_type = it.issue_type
          WHERE
              p.organisation = :p0 AND p.dataset = :p1
              AND it.severity == 'error'
          GROUP BY i.issue_type
          ORDER BY it.severity`,
    p0: req.params.orgId,
    p1: req.params.datasetId,
    _shape: "objects",
  };

  let queryString = new URLSearchParams(queryObj).toString();
  let endpoint = `${apiURL}?${queryString}`;

  let taskData = {};

  request(endpoint, (error, response, body) => {
    if (error) {
      return console.log(error);
    } else if (response.statusCode == 200) {
      taskData = JSON.parse(body);
      locals.tasks = taskData.rows;

      console.log(locals);

      res.render("/overview/tasklist", locals);
    }
  });
});

router.get("/:orgId/dataset/:datasetId/http-error", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  let apiURL = "https://datasette.planning.data.gov.uk/digital-land.json";

  let queryObj = {
    sql: `
SELECT
  p.organisation,
  o.name,
  d.name as dataset_name,
  rle.pipeline,
  rle.endpoint,
  rle.endpoint_url,
  rle.status as http_status,
  rle.latest_log_entry_date,
  rle.days_since_200,
  CASE
    WHEN l.status = 200
    THEN l.entry_date
  END AS latest_200_date
FROM
  provision p
  LEFT JOIN organisation o ON o.organisation = p.organisation
  LEFT JOIN reporting_latest_endpoints rle ON REPLACE(rle.organisation, '-eng', '') = p.organisation
  AND rle.pipeline = p.dataset
  INNER JOIN dataset d ON d.dataset = p.dataset
  INNER JOIN log l ON l.endpoint = rle.endpoint
WHERE
  p.organisation = :p0
  AND p.dataset = :p1
GROUP BY
  p.organisation
`,
    p0: req.params.orgId,
    p1: req.params.datasetId,
    _shape: "objects"
  }

  let queryString = new URLSearchParams(queryObj).toString();
  let endpoint = `${apiURL}?${queryString}`;

  let errorData = {};

  request(endpoint, (error, response, body) => {
    if (error) {
      return console.log(error);
    } else if (response.statusCode == 200) {
      errorData = JSON.parse(body);
      locals.errorData = errorData.rows[0];

      console.log(locals);

      res.render("/overview/http-error", locals);
    }
  });
});

router.get("/:orgId/dataset/:datasetId/error/:resourceId/:issueType", (req, res) => {
  let locals = {};
  const organisations = require("../data/organisations.json");
  const datasets = require("../data/datasets.json");

  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );

  locals.dataset = datasets.find((x) => x.dataset == req.params.datasetId);


  let apiURL = "https://datasette.planning.data.gov.uk/digital-land.json";

  let queryObj = {
    sql: `
      select
        i.rowid,
        i.end_date,
        i.entry_date,
        i.entry_number,
        i.field,
        i.issue_type,
        i.line_number,
        i.dataset,
        i.resource,
        i.start_date,
        i.value,
        i.message,
        it.severity
      from
        issue i
      LEFT JOIN issue_type it ON i.issue_type = it.issue_type
      where
        i.resource = :p0
        AND i.issue_type = :p1
        AND it.severity = "error"
      order by
        i.rowid
      `,
    p0: req.params.resourceId,
    p1: req.params.issueType,
    _shape: "objects"
  }

  let queryString = new URLSearchParams(queryObj).toString();
  let endpoint = `${apiURL}?${queryString}`;

  let errorData = {};

  request(endpoint, (error, response, body) => {
    if (error) {
      return console.log(error);
    } else if (response.statusCode == 200) {
      errorData = JSON.parse(body);
      locals.errorData = errorData.rows;

      console.log(locals);

      res.render("/overview/error", locals);
    }
  });
});