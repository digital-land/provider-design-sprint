//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require("govuk-prototype-kit");
const router = govukPrototypeKit.requests.setupRouter();
const fs = require("fs");
const path = require("path");

const { queryDatasette, getOrg, getDataset, convertToCSV } = require('./routes/functions.js')

router.post("/columnMappingArticle4/upload-method", (req, res) => {
  try {
    if (req.body.check.uploadMethod == "file") {
      res.redirect("/columnMappingArticle4/upload");
    } else {
      res.redirect("/columnMappingArticle4/url");
    }
  } catch (e) {
    res.redirect("/columnMappingArticle4/url");
  }
});

router.post("/columnMappingArticle4/upload", (req, res) => {
  res.redirect("/columnMappingArticle4/columns");
});

router.post("/columnMappingArticle4/url", (req, res) => {
  res.redirect("/columnMappingArticle4/columns");
});

router.post("/columnMappingArticle4/geometry", (req, res) => {
  res.redirect("/columnMappingArticle4/start-date");
});

router.post("/columnMappingArticle4/start-date", (req, res) => {
  res.redirect("/columnMappingArticle4/end-date");
});

router.post("/columnMappingArticle4/end-date", (req, res) => {
  res.redirect("/columnMappingArticle4/submit");
});

router.post("/columnMappingArticle4/article4Results", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

// ============

router.post("/columnMappingTree/upload-method", (req, res) => {
  try {
    if (req.body.check.uploadMethod == "file") {
      res.redirect("/columnMappingTree/upload");
    } else {
      res.redirect("/columnMappingTree/url");
    }
  } catch (e) {
    res.redirect("/columnMappingTree/url");
  }
});

router.post("/columnMappingTree/upload", (req, res) => {
  res.redirect("/columnMappingTree/columns");
});

router.post("/columnMappingTree/url", (req, res) => {
  res.redirect("/columnMappingTree/columns");
});

router.post("/columnMappingTree/geometry", (req, res) => {
  res.redirect("/columnMappingTree/start-date");
});

router.post("/columnMappingTree/start-date", (req, res) => {
  res.redirect("/columnMappingTree/end-date");
});

router.post("/columnMappingTree/end-date", (req, res) => {
  res.redirect("/columnMappingTree/submit");
});

router.post("/columnMappingTree/results", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

// ============

router.post("/taskLists/conservation-area-results", (req, res) => {
  if (req.body.check.dataLooksUpToDate == "yes") {
    req.body.check.progress.provideArticle4.read = true;
  }
  res.redirect("/taskLists/taskChecklist");
});

router.post("/taskLists/article4DataGuidance", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

router.post("/taskLists/createYourDataFile", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

router.post("/taskLists/publishYourDataFile", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

router.post("/taskLists/tpz-error-results", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

router.post("/taskLists/conservation-area-results", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

router.post("/taskLists/let-us-know-if-your-data-is-up-to-date", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

// =====================

router.post("/submit-endpoint-article4/confirmation", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

// =====================

router.post("/submit-endpoint-tree/confirmation", (req, res) => {
  res.redirect("/taskLists/taskChecklist");
});

// ======================

const request = require("request");
const _ = require("lodash");
const camden = require("../app/data/camden.json");
const camden2 = require("../app/data/camden2.json");

router.all("*", (req, res, next) => {
  res.locals.query = req.query;
  next();
});

router.get("/submit-endpoint-article4/dataset", (req, res) => {
  let options = [
    { text: "Article 4 direction dataset" },
    { text: "Conservation area dataset" },
  ];

  options = options.map((option) => {
    option.value = option.text;
    return option;
  });

  res.render("/submit-endpoint-article4/dataset", {
    options,
  });
});

router.post("/submit-endpoint-article4/dataset", (req, res) => {
  res.redirect("/upload-method");
});

router.post("/upload-method", (req, res) => {
  if (req.body.check.uploadMethod == "file") {
    res.redirect("/upload");
  } else {
    res.redirect("/url");
  }
});

router.post("/upload", (req, res) => {
  if (req.body.check.file == "no-errors.csv") {
    res.redirect("/no-errors");
  } else {
    res.redirect("/upload-progress");
  }
});

router.post("/url", (req, res) => {
  if (req.body.check.url == "https://good.com") {
    res.redirect("/no-errors");
  } else {
    res.redirect("/errors");
  }
});

router.get("/errors", (req, res) => {
  // let rows = camden.slice(0, 10);
  let rows = camden;

  rows = rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key] = { value: row[key] };
    }
    return newRow;
  });

  rows.map((row) => {
    let newRow = row;
    newRow.Reference.value = "";
    return newRow;
  });

  rows.map((row) => {
    let newRow = row;
    let errorType = _.sample([
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "Start date must be today or in the past",
      "Geometry must be in England",
    ]);

    newRow.Reference.value = "";
    newRow.Reference.error = errorType;

    switch (errorType) {
      case "Reference missing":
        // newRow.Reference.value = ''
        // newRow.Reference.error = errorType
        break;
      case "Start date must be today or in the past":
        newRow["Start date"].value = "01/12/2025";
        newRow["Start date"].error = errorType;
        break;
      case "Geometry must be in England":
        newRow["Geometry"].error = errorType;
        break;
    }
    return newRow;
  });

  const locationErrorCount = rows.reduce((acc, row) => {
    if (row.Geometry.error) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const referenceErrorCount = rows.reduce((acc, row) => {
    if (row.Reference.error) {
      return acc + 1;
    }
    return acc;
  }, 0);

  const startDateErrorCount = rows.reduce((acc, row) => {
    if (row["Start date"].error) {
      return acc + 1;
    }
    return acc;
  }, 0);
  res.render("errors", {
    rows,
    referenceErrorCount,
    locationErrorCount,
    startDateErrorCount,
  });
});

router.get("/no-errors", (req, res) => {
  let rows = camden;

  rows = rows.map((row) => {
    const newRow = {};
    for (const key in row) {
      newRow[key] = { value: row[key] };
    }
    return newRow;
  });
  res.render("no-errors", {
    rows,
    camden: JSON.stringify(camden2),
  });
});

router.post("/no-errors", (req, res) => {
  if (req.body.check.isCorrect == "Yes") {
    res.redirect("/confirmation");
  } else {
    res.redirect("/upload-method");
  }
});

router.use("/submit-endpoint/*", (req, res, next) => {
  res.locals.serviceName = "Submit your planning and housing data for England";
  next();
});

router.get("/submit-endpoint-*/lpa-details", (req, res) => {
  const lpaDataUrl =
    "https://www.planning.data.gov.uk/entity.json?dataset=local-authority&limit=400";

  let lpaData = {};

  request(lpaDataUrl, (error, response, body) => {
    if (error) {
      return console.log(error);
    } else if (response.statusCode == 200) {
      lpaData = JSON.parse(body);
      lpaArray = [];

      lpaData.entities.forEach((lpa) => {
        lpaArray.push({
          text: lpa.name,
          value: lpa.name,
        });
      });

      res.render("submit-endpoint-article4/lpa-details.html", {
        lpaData: lpaArray,
      });
    }
  });
});

router.get("/submit-endpoint-*/choose-dataset", (req, res) => {
  let options = [
    { text: "Article 4 direction dataset" },
    { text: "Conservation area dataset" },
    { text: "Tree dataset" },
  ];

  options = options.map((option) => {
    option.value = option.text;
    return option;
  });

  res.render("submit-endpoint-article4/choose-dataset.html", {
    options,
  });
});

router.get("/overview/start", (req, res) => {
  res.render("/overview/start");
});

router.get("/overview/organisations", (req, res) => {
  const organisations = require("../app/data/organisations.json");
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

router.get("/overview/:orgId", (req, res) => {
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );

  res.render("/overview/lpa-overview-list", locals);
});

router.get("/overview/:orgId/v1", (req, res) => {
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

router.get("/overview/:orgId/v2", (req, res) => {
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

router.get("/overview/:orgId/dataset/:datasetId", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/dataset-details", locals);
});

router.get("/overview/:orgId/dataset/:datasetId/get-started", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/get-started.html", locals);
});

router.get("/overview/:orgId/dataset/:datasetId/tasklist", (req, res) => {
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

router.get("/overview/:orgId/dataset/:datasetId/http-error", (req, res) => {
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

router.get("/overview/:orgId/dataset/:datasetId/error/:resourceId/:issueType", (req, res) => {
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  const datasets = require("../app/data/datasets.json");

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



// v1 routes for user research session July 24

router.get("/overview/v1/start", (req, res) => {
  res.render("/overview/v1/start");
});

router.get("/overview/v1/organisations", (req, res) => {
  const organisations = require("../app/data/organisations.json");
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

  res.render("/overview/v1/organisations", { alphabetisedOrgs: alphabetisedOrgs });
});

router.get("/overview/v1/:orgId", (req, res) => {
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

      res.render("/overview/v1/lpa-overview", locals);
    }
  });
});

router.get("/overview/v1/:orgId/dataset/:datasetId/get-started", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/v1/get-started.html", locals);
});


// v2 routes for user research session July 24

router.get("/overview/v2/start", (req, res) => {
  res.render("/overview/v2/start");
});

router.get("/overview/v2/organisations", (req, res) => {
  const organisations = require("../app/data/organisations.json");
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

  res.render("/overview/v2/organisations", { alphabetisedOrgs: alphabetisedOrgs });
});

router.get("/overview/v2/:orgId", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);

  const queryObj = {
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
    ) > 0 THEN 'Needs fixing'
    ELSE 'Live'
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

  const lpaData = await queryDatasette(queryObj);
  locals.datasets = lpaData.rows;

  locals.datasetCount = locals.datasets.length;
  locals.datasetsSubmitted = locals.datasets.filter(
    (row) => row.endpoint != null
  ).length;
  locals.datasetErrors = locals.datasets.filter(
    (row) => row.status == "Error"
  ).length;
  locals.datasetIssues = locals.datasets.filter(
    (row) => row.status == "Needs fixing"
  ).length;

  res.render("/overview/v2/lpa-overview", locals);
});

router.get("/overview/v2/:orgId/dataset/:datasetId/get-started", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/v2/get-started.html", locals);
});

router.get("/overview/v2/:orgId/dataset/:datasetId", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  const queryObj = {
    sql: `SELECT
    p.organisation,
    o.name,
    p.dataset,
    d.name as dataset_name,
    rle.endpoint,
    rle.resource,
    rle.exception,
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
      ) > 0 THEN 'Needs fixing'
      ELSE 'Live'
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
    AND it.issue_type != 'unknown entity - missing reference'
GROUP BY i.issue_type
ORDER BY it.severity`,
    p0: req.params.orgId,
    p1: req.params.datasetId,
    _shape: "objects",
  };

  const taskData = await queryDatasette(queryObj);
  locals.tasks = taskData.rows;

  if (taskData.rows.length > 0) {
    const datasetQuery = {
      sql: `
  select
    count(distinct fr.entry_number)
  from
    fact_resource fr
  where
    fr.resource = :p0
      `
    }

    datasetQuery.p0 = taskData.rows[0].resource
    const numRows = await queryDatasette(datasetQuery, req.params.datasetId)
    locals.num_rows = numRows.rows[0][0]
  }

  res.render("/overview/v2/dataset-details", locals);
});

router.get("/overview/v2/:orgId/dataset/:datasetId/tasklist", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);
  locals.mappings = require("../app/data/mappings.json")

  const queryObj = {
    sql: `SELECT
    p.organisation,
    o.name,
    p.dataset,
    d.name as dataset_name,
    rle.endpoint,
    rle.resource,
    rle.exception,
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
      ) > 0 THEN 'Needs fixing'
      ELSE 'Live'
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
    AND it.issue_type != 'unknown entity - missing reference'
GROUP BY i.issue_type
ORDER BY it.severity`,
    p0: req.params.orgId,
    p1: req.params.datasetId,
    _shape: "objects",
  };

  const taskData = await queryDatasette(queryObj);
  locals.tasks = taskData.rows;

  if (taskData.rows.length > 0) {
    const datasetQuery = {
      sql: `
  select
    count(distinct fr.entry_number)
  from
    fact_resource fr
  where
    fr.resource = :p0
      `
    }

    datasetQuery.p0 = taskData.rows[0].resource
    const numRows = await queryDatasette(datasetQuery, req.params.datasetId)
    locals.num_rows = numRows.rows[0][0]
  }

  res.render("/overview/v2/tasklist", locals);
});

router.get("/overview/v2/:orgId/dataset/:datasetId/http-error", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

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

  const errorData = await queryDatasette(queryObj)
  locals.errorData = errorData.rows[0];

  res.render("/overview/v2/http-error", locals);
});

router.get("/overview/v2/:orgId/dataset/:datasetId/error/:resourceId/:issueType", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);
  locals.mappings = require("../app/data/mappings.json")

  const issueQuery = {
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
    _shape: 'objects'
  }

  const issuesResponse = await queryDatasette(issueQuery);
  const entriesArray = [];

  issuesResponse.rows.forEach(row => {
    if (!entriesArray.includes(row.entry_number)) entriesArray.push(row.entry_number);
  });

  let pageNum = Number(req.query.page)
  if (req.query.page == undefined) pageNum = 1;

  let entryId = entriesArray[pageNum - 1]

   const entityQuery = {
    sql: `
select
  fr.rowid,
  fr.end_date,
  fr.fact,
  fr.entry_date,
  fr.entry_number,
  fr.resource,
  fr.start_date,
  ft.entity,
  ft.field,
  ft.entry_date,
  ft.start_date,
  ft.value
from
  fact_resource fr
left join
  fact ft on fr.fact = ft.fact
where
  fr.resource = :p0
  and fr.entry_number = :p1
order by
  fr.rowid
    `,
    p0: req.params.resourceId,
    p1: entryId,
    _shape: 'objects'
  }

  const entriesResponse = await queryDatasette(entityQuery, database=req.params.datasetId);

  const issueSummaryByEntry = []

  issuesResponse.rows.forEach(issue => {
    let i = issueSummaryByEntry.findIndex(
      (entry) => entry.entry_number == issue.entry_number
    )

    if (i == -1) {
      const entry = {
        entry_number: issue.entry_number,
        fields: []
      }

      i = issueSummaryByEntry.push(entry) - 1
    }

    issueSummaryByEntry[i].fields.push(issue.field)
    issueSummaryByEntry[i].issue_type = issue.issue_type
  });

  const entryItem = {
    entry_number: entryId,
    fields: []
  }

  entriesResponse.rows.forEach(row => {
    entryItem.fields.push({
      field: row.field,
      value: row.value
    })
  })

  issuesResponse.rows.forEach(row => {
    if (row.entry_number == entryId) {
      entryItem.fields.push({
        field: row.field,
        value: row.value,
        issue_type: row.issue_type,
        message: row.message
      })
    }
  })

  entryItem.fields.sort((a, b) => a.field.localeCompare(b.field))

  let numEntries = issueSummaryByEntry.length;

  const datasetQuery = {
    sql: `
select
  count(distinct fr.entry_number)
from
  fact_resource fr
where
  fr.resource = :p0
    `,
    p0: req.params.resourceId,
  }

  const numRows = await queryDatasette(datasetQuery, req.params.datasetId)
  locals.num_rows = numRows.rows[0][0]

  const paginationObj = {}
  if (pageNum > 1) {
    paginationObj.prevObj = {
      href: `${req.path}?page=${pageNum - 1}`
    }
  }

  if (pageNum < numEntries) {
    paginationObj.nextObj = {
      href: `${req.path}?page=${pageNum + 1}`
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
        href: `${req.path}?page=${i}`
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

  locals.issues = issuesResponse.rows;
  locals.entries = entriesResponse.rows;
  locals.issue_summary_by_entry = issueSummaryByEntry;
  locals.entry_item = entryItem;
  locals.entry_id = entryId;
  locals.num_entries = issueSummaryByEntry.length;
  locals.page_url = req.path;
  locals.page_num = pageNum;
  locals.pagination_obj = paginationObj;
  
  res.render("/overview/v2/error", locals);
});

router.get("/overview/:version?/:orgId/dataset/:datasetId/error/:resourceId/:issueType/table", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  const fieldsQuery = {
    sql: `
select
  rowid,
  field,
  dataset
from
  column_field
group by
  field
order by
  rowid
    `,
    _shape: 'objects'
  }

  const fieldsData = await queryDatasette(fieldsQuery, req.params.datasetId)
  locals.expected_fields = fieldsData.rows

  const issueQuery = {
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
        AND i.entry_number <= 100
      order by
        i.rowid
      `,
    p0: req.params.resourceId,
    p1: req.params.issueType,
    _shape: 'objects'
  }

  const issuesResponse = await queryDatasette(issueQuery);
  const entriesArray = [];

  issuesResponse.rows.forEach(row => {
    if (!entriesArray.includes(row.entry_number)) entriesArray.push(row.entry_number);
  });

  let pageNum = Number(req.query.page)
  if (req.query.page == undefined) pageNum = 1;

  let entryId = entriesArray[pageNum - 1]

   const entityQuery = {
    sql: `
select
  fr.rowid,
  fr.end_date,
  fr.fact,
  fr.entry_date,
  fr.entry_number,
  fr.resource,
  fr.start_date,
  ft.entity,
  ft.field,
  ft.entry_date,
  ft.start_date,
  ft.value
from
  fact_resource fr
left join
  fact ft on fr.fact = ft.fact
where
  fr.resource = :p0
  and fr.entry_number <= 100
group by
  fr.entry_number,
  ft.field
order by
  fr.rowid
    `,
    p0: req.params.resourceId,
    _shape: 'objects'
  }

  const entriesResponse = await queryDatasette(entityQuery, database=req.params.datasetId);
  console.log(entriesResponse);

  const issueSummaryByEntry = []

  issuesResponse.rows.forEach(issue => {
    let i = issueSummaryByEntry.findIndex(
      (entry) => entry.entry_number == issue.entry_number
    )

    if (i == -1) {
      const entry = {
        entry_number: issue.entry_number,
        fields: []
      }

      issueSummaryByEntry.push(entry)
      i = issueSummaryByEntry.length -1
    }

    issueSummaryByEntry[i].fields.push(issue.field)
    issueSummaryByEntry[i].issue_type = issue.issue_type
  });

  const fieldsByEntry = []

  issuesResponse.rows.forEach(row => {
    let i = fieldsByEntry.findIndex(
      (entry) => entry.entry_number == row.entry_number
    )

    if (i == -1) {
      const entryItem = {
        entry_number: row.entry_number,
        fields: []
      }

      fieldsByEntry.push(entryItem)
      i = fieldsByEntry.length -1
    }

    fieldsByEntry[i].fields.push({
      field: row.field,
      value: row.value,
      issue_type: row.issue_type,
      message: row.message
    })
  })

  fieldsByEntry.forEach(entry => {
    entriesResponse.rows.forEach(row => {
      if (entry.entry_number == row.entry_number) {
        entry.fields.push({
          field: row.field,
          value: row.value
        })
      }
    })

    entry.fields.sort((a, b) => a.field.localeCompare(b.field))
  })

  let numEntries = issueSummaryByEntry.length;

  const paginationObj = {}
  if (pageNum > 1) {
    paginationObj.prevObj = {
      href: `${req.path}?page=${pageNum - 1}`
    }
  }

  if (pageNum < numEntries) {
    paginationObj.nextObj = {
      href: `${req.path}?page=${pageNum + 1}`
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
        href: `${req.path}?page=${i}`
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

  locals.issues = issuesResponse.rows;
  locals.entries = entriesResponse.rows;
  locals.issue_summary_by_entry = issueSummaryByEntry;
  locals.fields_by_entry = fieldsByEntry;
  locals.entry_id = entryId;
  locals.num_entries = issueSummaryByEntry.length;
  locals.page_url = req.path;
  locals.page_num = pageNum;
  locals.pagination_obj = paginationObj;
  
  res.render(`/overview/${req.params.version}/error-table`, locals);
});

router.get("/check/:orgId/:datasetId/choose-upload", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/choose-upload", locals);
})

router.get("/check/:orgId/:datasetId/upload-data", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/upload-data", locals);
})

router.get("/check/:orgId/:datasetId/checking-file", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/checking-file", locals);
})

router.get("/check/:orgId/:datasetId/results", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/results", locals);
})

router.get("/check/:orgId/:datasetId/errors", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/errors", locals);
})

router.get("/check/:orgId/:datasetId/confirmation", async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check/confirmation", locals);
})

/**********************************************************
 * Iterative Check research routes — 2024-12-09           *
***********************************************************/

router.get(["/iterative-check", "/iterative-check/start"], async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";

  res.render("/common/landing", locals);
})

router.get("/iterative-check/organisations", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";

  locals.organisations = require("../app/data/organisations.json");
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

router.get("/iterative-check/organisations/:orgId", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  
  const orgSlug = req.params.orgId.replace(/:/, "_");
  const orgPath = path.join(__dirname, `../app/data/${orgSlug}/datasets.json`);

  if (fs.existsSync(orgPath)) {
    locals.datasets = require(orgPath);
  } else {
    locals.datasets = require('../app/data/default/datasets.json');
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

router.get("/iterative-check/organisations/:orgId/:datasetId", (req, res) => {
  res.redirect(`/iterative-check/organisations/${req.params.orgId}/${req.params.datasetId}/get-started`);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/get-started", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/get-started", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/choose-upload", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/choose-upload", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/upload-data", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/upload-data", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/checking-file", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/checking-file", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/results", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/results-blocked", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/results-non-blocked", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/results-non-blocked", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/issue-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/issue-detail-blocking", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/issue-non-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/issue-detail-non-blocking", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/check-data", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/check-data", locals);
})

router.get("/iterative-check/organisations/:orgId/:datasetId/confirmation", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative/confirmation", locals);
})

/******************************************/
/*  Multiple endpoints — 18 December 2024 */
/******************************************/

router.get("/multiple-endpoints/organisations/:orgId/:datasetId", (req, res) => {
  const locals = {};
  locals.version_path = "/multiple-endpoints";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.endpoints = require("../app/data/endpoints.json");

  res.render("/multiple-endpoints/dataset-details", locals);
})

/******************************************/
/*  Integrated submit — 8 January 2024    */
/******************************************/

router.get("/submit-dataset/organisations/:orgId/:datasetId", (req, res) => {
  const locals = {};
  locals.version_path = "/submit-dataset";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/get-started", locals);
})

router.get("/submit-dataset/organisations/:orgId/:datasetId/lpa-details", (req, res) => {
  const locals = {};
  locals.version_path = "/submit-dataset";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/lpa-details", locals);
})

router.get("/submit-dataset/organisations/:orgId/:datasetId/endpoint-details", (req, res) => {
  const locals = {};
  locals.version_path = "/submit-dataset";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/endpoint-details", locals);
})

router.get("/submit-dataset/organisations/:orgId/:datasetId/check-answers", (req, res) => {
  const locals = {};
  locals.version_path = "/submit-dataset";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/check-answers", locals);
})

router.get("/submit-dataset/organisations/:orgId/:datasetId/confirmation", (req, res) => {
  const locals = {};
  locals.version_path = "/submit-dataset";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/submit-dataset/confirmation", locals);
})

/**********************************************************
 * Iterative Check v2 — 2025-01-14                        *
***********************************************************/

router.get(["/iterative-check-v2", "/iterative-check-v2/start"], async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";

  res.render("/common/landing", locals);
})

router.get("/iterative-check-v2/organisations", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";

  locals.organisations = require("../app/data/organisations.json");
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

router.get("/iterative-check-v2/organisations/:orgId", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);

  console.log(locals.organisation)
  
  const orgSlug = req.params.orgId.replace(/:/, "_");
  const orgPath = path.join(__dirname, `../app/data/${orgSlug}/datasets.json`);

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

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/overview", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
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
  // locals.endpoints = require("../app/data/endpoints.json");

  const boundaryResponse = await getBoundaryGeoJson(req.params.orgId);
  locals.boundary_geojson = JSON.stringify(boundaryResponse);

  res.render("/check-iterative-v2/dataset-details", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/get-started", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/get-started", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/choose-upload", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/choose-upload", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/upload-data", async (req, res) => {
  if (req.session.data['upload_method'] == "url") {
    const url = `/iterative-check-v2/organisations/${req.params.orgId}/${req.params.datasetId}/endpoint-details`
    res.redirect(url)
  } else {
    const locals = {};
    locals.version_path = "/iterative-check-v2";
    locals.organisation = getOrg(req.params.orgId);
    locals.dataset = getDataset(req.params.datasetId);

    res.render("/check-iterative-v2/upload-data", locals);
  }
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/endpoint-details", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/endpoint-details", locals);
})


router.get("/iterative-check-v2/organisations/:orgId/:datasetId/checking-file", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/checking-file", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/results", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/results-blocked", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/results-non-blocked", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/results-non-blocked", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/issue-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/issue-detail-blocking", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/issue-non-blocking", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/issue-detail-non-blocking", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/share-results", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/share-results", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/share-confirmation", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/share-confirmation", locals);
})

router.get("/iterative-check-v2/organisations/:orgId/:datasetId/confirmation", async (req, res) => {
  const locals = {};
  locals.version_path = "/iterative-check-v2";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/check-iterative-v2/confirmation", locals);
})

/**********************************************************
 * Expectations checks - 2025-02-10                       *
***********************************************************/
router.get(["/expectations", "/expectations/start"], async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";

  res.render("/common/landing", locals);
})

router.get("/expectations/organisations", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";

  locals.organisations = require("../app/data/organisations.json");
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

router.get("/expectations/organisations/:orgId", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
  locals.organisation = getOrg(req.params.orgId);
  
  const orgSlug = req.params.orgId.replace(/:/, "_");
  const orgPath = path.join(__dirname, `../app/data/${orgSlug}/datasets.json`);

  if (fs.existsSync(orgPath)) {
    locals.datasets = require(orgPath);
  } else {
    locals.datasets = require('../app/data/default/datasets.json');
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
})

router.get("/expectations/organisations/:orgId/:datasetId/overview", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
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
  // locals.endpoints = require("../app/data/endpoints.json");

  res.render("/check-iterative-v2/dataset-details", locals);
})

router.get("/expectations/organisations/:orgId/:datasetId/get-started", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/expectations/get-started-alternative-sources", locals);
})

router.get("/expectations/organisations/:orgId/:datasetId/get-started-no-alternative-sources", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/expectations/get-started", locals);
})

router.get("/expectations/organisations/:orgId/:datasetId/review-alternative-sources", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.conservation_areas = require("../app/data/alternative-conservation-areas.json");
  locals.conservation_area_count = locals.conservation_areas.length;

  res.render("/expectations/review-alternative-sources", locals);
})

router.post("/expectations/organisations/:orgId/:datasetId/review-handler", (req, res) => {
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

router.get("/expectations/organisations/:orgId/:datasetId/review-record/:record_index?", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.conservation_areas = require("../app/data/alternative-conservation-areas.json");
  locals.conservation_area_count = locals.conservation_areas.length;

  locals.conservation_area_index = req.params.record_index
  if (locals.conservation_area_index == null) {
    locals.conservation_area_index = 0;
  }

  res.render("/expectations/review-record", locals);
})

router.get("/expectations/organisations/:orgId/:datasetId/download-report", async (req, res) => {
  const locals = {};
  locals.version_path = "/expectations";
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  locals.conservation_areas = require("../app/data/alternative-conservation-areas.json");
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

  locals.download_geojson = JSON.stringify(locals.selected_areas, null, 2);
  locals.download_csv = convertToCSV(locals.selected_areas);

  res.render("/expectations/download-report", locals);
})

router.get('/expectations/organisations/:orgId/:datasetId/download-file', async (req, res) => {
  const conservation_areas = require("../app/data/alternative-conservation-areas.json");

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
})

/**********************************************************
 * Landing page iterations - 2025-04-28                   *
***********************************************************/
require('./routes/landing-iteration.js')

/**********************************************************
 * alternative sources - 2025-05-20                   *
***********************************************************/
require('./routes/alternative-sources.js')

/**********************************************************
 * Proxy API routes for map data                          *
***********************************************************/
require('./routes/api.js')