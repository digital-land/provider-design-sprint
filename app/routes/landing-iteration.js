const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter('/landing-iteration')
const asyncHandler = require('express-async-handler');

const fs = require("fs");
const path = require("path");

const version = '/landing-iteration'

const { queryDatasette, getOrg, getDataset, convertToCSV } = require('./functions.js')

/**********************************************************
 * Landing page iterations - 2025-04-28                   *
***********************************************************/

router.get('/v1', (req, res) => {
  const locals = {};
  locals.serviceName = "Check and provide planning data";
  locals.version_path = "/landing-iteration/v1";

  res.render('/landing-iteration/landing-v1.html', locals);
})

router.get('/:version_path/check', (req, res) => {
  if (req.params.version_path == "v2") {
    res.redirect(`${version}/${req.params.version_path}/check-choose-dataset`)
  } else {
    const locals = {};
    locals.serviceName = "Check your planning data";
    locals.version_path = `/landing-iteration/${req.params.version_path}`;

    locals.organisations = require('../data/organisations.json')

    res.render('/landing-iteration/check-choose-organisation.html', locals);
  }
})

router.get('/:version_path/check-choose-dataset', (req, res) => {
  const locals = {};
  locals.serviceName = "Check your planning data";
  locals.version_path = `/landing-iteration/${req.params.version_path}`;

  locals.datasets = require('../data/default/datasets.json')

  res.render('/landing-iteration/check-choose-dataset.html', locals);
})

router.get('/:version_path/check-upload-method', (req, res) => {
  const locals = {};
  locals.serviceName = "Check your planning data";
  locals.version_path = `/landing-iteration/${req.params.version_path}`;

  res.render('/landing-iteration/check-upload-method.html', locals);
})

router.get('/:version_path/provide', (req, res) => {
  const locals = {};
  locals.serviceName = "Provide your planning data";
  locals.version_path = `/landing-iteration/${req.params.version_path}`;

  locals.organisations = require('../data/organisations.json')

  res.render('/landing-iteration/provide-choose-organisation.html', locals);
})

router.get('/:version_path/provide-choose-dataset', (req, res) => {
  const locals = {};
  locals.serviceName = "Provide your planning data";
  locals.version_path = `/landing-iteration/${req.params.version_path}`;

  locals.datasets = require('../data/default/datasets.json')

  res.render('/landing-iteration/provide-choose-dataset.html', locals);
})

router.get('/:version_path/organisations', (req, res) => {
  const locals = {};
  locals.serviceName = "Check and provide planning data";
  locals.version_path = `/landing-iteration/${req.params.version_path}`;

  locals.organisations = require('../data/organisations.json')
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
  res.render('/common/organisations.html', locals);
})

router.get('/:version_path/organisations/:orgId',asyncHandler(async (req, res) => {
  const locals = {};
  locals.serviceName = "Check and provide planning data";
  locals.version_path = `/landing-iteration/${req.params.version_path}`;

  locals.organisation = getOrg(req.params.orgId);

  if (req.session.data.authenticated === true
      && req.session.data.authenticatedOrg
      && req.session.data.authenticatedOrg.organisation === locals.organisation.organisation) {
    locals.navigationOrganisationActive = true;
  }

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
    find(x => x.dataset === 'brownfield-land').notice;

  res.render('/landing-iteration/lpa-overview.html', locals);
}))

router.get("/:version_path/organisations/:orgId/:datasetId/overview", (req, res) => {
  const locals = {};
  locals.version_path = `/landing-iteration/${req.params.version_path}`;
  locals.organisation = getOrg(req.params.orgId);
  locals.dataset = getDataset(req.params.datasetId);

  if (req.session.data.authenticated === true
      && req.session.data.authenticatedOrg
      && req.session.data.authenticatedOrg.organisation === locals.organisation.organisation) {
    locals.navigationOrganisationActive = true;
  }

  res.render("/landing-iteration/dataset-details", locals);
})

router.get('/v2', (req, res) => {
  const locals = {};
  locals.serviceName = "Check and provide planning data";
  locals.version_path = "/landing-iteration/v2";

  res.render('/landing-iteration/landing-v2.html', locals);
})

router.get('/v2/authentication-email', (req, res) => {
  const locals = {};
  locals.serviceName = "Check and provide planning data";
  locals.version_path = "/landing-iteration/v2";

  res.render('/landing-iteration/authentication-email.html', locals)
})

router.get('/v2/authentication-email-validation', (req, res) => {
  const locals = {};
  locals.serviceName = "Check and provide planning data";
  locals.version_path = "/landing-iteration/v2";

  res.render('/landing-iteration/authentication-email-validation.html', locals)
})

router.post('/v2/validate-email', (req, res) => {
  const organisations = require('../data/organisations.json')

  let chosenOrg = {};
  if (req.session.data.authentication_email != "") {
    const emailDomain = req.session.data.authentication_email.match(/^.+@(.+)$/)[1]

    organisations.some((org) => {
      const authoritiveDomain = org.website.match(/^https?:\/\/(www\.)?([\w\.-]+)(:\d+)?(\/.*)?$/)[2]

      if (emailDomain == authoritiveDomain) {
        chosenOrg = org
        return true
      }
    })
  }

  if (chosenOrg.organisation) {
    req.session.data.authenticated = true
    req.session.data.authenticatedOrg = chosenOrg

    res.redirect(`${version}/v2/organisations/${chosenOrg.organisation}`)
  } else {
    res.redirect(`${version}/v2/authentication-failed`)
  }
})

router.get('/v2/authentication-failed', (req, res) => {
  const locals = {}
  locals.version_path = '/landing-iteration/v2';

  res.render('/landing-iteration/authentication-failed', locals)
})

router.get(/\/(v1|v2)\/guidance/, (req, res) => {
  res.render('/landing-iteration/guidance.html')
})

module.exports = router
