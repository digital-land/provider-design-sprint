//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require("govuk-prototype-kit");
const router = govukPrototypeKit.requests.setupRouter();

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

router.get("*/lpa-details", (req, res) => {
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

router.get("*/choose-dataset", (req, res) => {
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

router.get("/overview/start", (req, res) => {
  res.render("/overview/start");
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
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );

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
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );

  let apiURL = "https://datasette.planning.data.gov.uk/digital-land.json";

  let queryObj = {
    sql: `SELECT
    p.organisation,
    o.name,
    p.dataset,
    d.name as dataset_name,
    rle.pipeline,
    rle.endpoint,
    rle.resource,
    rle.exception,
    rle.status as http_status,
    case 
           when (rle.status != '200') then 'Error'
           when (it.severity = 'error') then 'Issue'
           when (it.severity = 'warning') then 'Warning'
           else 'No issues'
           end as status,
    case
            when (it.severity = 'info') then ''
            else i.issue_type
        end as issue_type,
        case
            when (it.severity = 'info') then ''
            else it.severity
        end as severity,
        it.responsibility,
        COUNT(
            case
            when it.severity != 'info' then 1
            else null
            end
        ) as issue_count
FROM
    provision p
LEFT JOIN
    organisation o ON o.organisation = p.organisation
LEFT JOIN
    reporting_latest_endpoints rle
    ON REPLACE(rle.organisation, '-eng', '') = p.organisation
    AND rle.pipeline = p.dataset
LEFT JOIN
    issue i ON rle.resource = i.resource AND rle.pipeline = i.dataset
LEFT JOIN
    issue_type it ON i.issue_type = it.issue_type AND it.severity != 'info'
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
    p.organisation,
    o.name;`,
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
        (row) => row.status == "Warning" || row.status == "Issue"
      ).length;

      console.log(locals);

      res.render("/overview/lpa-overview-v2", locals);
    }
  });
});

router.get("/overview/:orgId/dataset/:datasetId", (req, res) => {
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  const datasets = require("../app/data/datasets.json");

  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );
  locals.dataset = datasets.find((x) => x.dataset == req.params.datasetId).name;

  res.render("/overview/dataset-details", locals);
});

router.get("/overview/:orgId/dataset/:datasetId/get-started", (req, res) => {
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  const datasets = require("../app/data/datasets.json");

  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );
  locals.dataset = datasets.find((x) => x.dataset == req.params.datasetId).name;

  res.render("/overview/get-started.html", locals);
});

router.get("/overview/:orgId/dataset/:datasetId/tasklist", (req, res) => {
  let locals = {};
  const organisations = require("../app/data/organisations.json");
  const datasets = require("../app/data/datasets.json");

  locals.organisation = organisations.find(
    (x) => x.organisation == req.params.orgId
  );

  locals.dataset = datasets.find((x) => x.dataset == req.params.datasetId).name;

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
              i.field,
              i.issue_type,
              i.line_number,
              i.value,
              i.message,
              it.responsibility,
              it.severity,
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
              AND it.severity != 'info'
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
