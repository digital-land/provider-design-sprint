//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/columnMappingArticle4/upload-method', (req, res) => {
    if(req.body.check.uploadMethod == 'file') {
      res.redirect('/columnMappingArticle4/upload')
    } else {
      res.redirect('/columnMappingArticle4/url')
    }
})

router.post('/columnMappingArticle4/upload', (req, res) => {
    res.redirect('/columnMappingArticle4/columns')
})

router.post('/columnMappingArticle4/url', (req, res) => {
    res.redirect('/columnMappingArticle4/columns')
})

router.post('/columnMappingArticle4/geometry', (req, res) => {
    res.redirect('/columnMappingArticle4/start-date')
})

router.post('/columnMappingArticle4/start-date', (req, res) => {
    res.redirect('/columnMappingArticle4/end-date')
})

router.post('/columnMappingArticle4/end-date', (req, res) => {
    res.redirect('/columnMappingArticle4/submit')
})

router.post('/columnMappingArticle4/article4Results', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

// ============

router.post('/columnMappingTree/upload-method', (req, res) => {
    if(req.body.check.uploadMethod == 'file') {
      res.redirect('/columnMappingTree/upload')
    } else {
      res.redirect('/columnMappingTree/url')
    }
})

router.post('/columnMappingTree/upload', (req, res) => {
    res.redirect('/columnMappingTree/columns')
})

router.post('/columnMappingTree/url', (req, res) => {
    res.redirect('/columnMappingTree/columns')
})

router.post('/columnMappingTree/geometry', (req, res) => {
    res.redirect('/columnMappingTree/start-date')
})

router.post('/columnMappingTree/start-date', (req, res) => {
    res.redirect('/columnMappingTree/end-date')
})

router.post('/columnMappingTree/end-date', (req, res) => {
    res.redirect('/columnMappingTree/submit')
})

router.post('/columnMappingTree/results', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

// ============

router.post('/taskLists/conservation-area-results', (req, res) => {
    if(req.body.check.dataLooksUpToDate == 'yes'){
        req.body.check.progress.provideArticle4.read = true
    }
    res.redirect('/taskLists/taskChecklist')
})

router.post('/taskLists/article4DataGuidance', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

router.post('/taskLists/createYourDataFile', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

router.post('/taskLists/publishYourDataFile', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

router.post('/taskLists/tpz-error-results', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

router.post('/taskLists/conservation-area-results', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})

router.post('/taskLists/let-us-know-if-your-data-is-up-to-date', (req, res) => {
    res.redirect('/taskLists/taskChecklist')
})



// Add your routes here
