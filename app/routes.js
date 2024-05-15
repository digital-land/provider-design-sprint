//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

const govukPrototypeKit = require('govuk-prototype-kit')
const router = govukPrototypeKit.requests.setupRouter()

router.post('/columnMapping/upload-method', (req, res) => {
    if(req.body.check.uploadMethod == 'file') {
      res.redirect('/columnMapping/upload')
    } else {
      res.redirect('/columnMapping/url')
    }
})

router.post('/columnMapping/upload', (req, res) => {
    res.redirect('/columnMapping/columns')
})

router.post('/columnMapping/url', (req, res) => {
    res.redirect('/columnMapping/columns')
})

router.post('/columnMapping/geometry', (req, res) => {
    res.redirect('/columnMapping/start-date')
})

router.post('/columnMapping/start-date', (req, res) => {
    res.redirect('/columnMapping/end-date')
})

router.post('/columnMapping/end-date', (req, res) => {
    res.redirect('/columnMapping/submit')
})

// Add your routes here
