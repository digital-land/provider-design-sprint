// v2 routes for user research session July 24
const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/overview/v2');

const { queryDatasette, getOrg, getDataset } = require('./functions.js');

router.get("/start", (req, res) => {
  res.render("/overview/v2/start");
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

  res.render("/overview/v2/organisations", { alphabetisedOrgs: alphabetisedOrgs });
});

router.get("/:orgId",asyncHandler(async (req, res) => {
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
}));

router.get("/:orgId/dataset/:datasetId/get-started", (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  res.render("/overview/v2/get-started.html", locals);
});

router.get("/:orgId/dataset/:datasetId",asyncHandler(async (req, res) => {
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
}));

router.get("/:orgId/dataset/:datasetId/tasklist",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);
  locals.mappings = require("../data/mappings.json")

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
}));

router.get("/:orgId/dataset/:datasetId/http-error",asyncHandler(async (req, res) => {
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
}));

router.get("/:orgId/dataset/:datasetId/error/:resourceId/:issueType",asyncHandler(async (req, res) => {
  const locals = {};
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);
  locals.mappings = require("../data/mappings.json")

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
}));

router.get("/overview/:version?/:orgId/dataset/:datasetId/error/:resourceId/:issueType/table",asyncHandler(async (req, res) => {
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
}));
