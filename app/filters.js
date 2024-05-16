//
// For guidance on how to create filters see:
// https://prototype-kit.service.gov.uk/docs/filters
//

const xGovFilters = require('@x-govuk/govuk-prototype-filters')

const govukPrototypeKit = require('govuk-prototype-kit')
const addFilter = govukPrototypeKit.views.addFilter

const { govukMarkdown } = xGovFilters

addFilter('govukMarkdown', govukMarkdown)

// Add your filters here

const toStatusIndicator = (status) => {
    if(status == 'complete'){
        return {
            text: 'complete'
        }
    }else if(status == 'started'){
        return {
            tag: {
                text: "started",
                classes: "govuk-tag--green"
            }
        }
    }else if(status == 'incomplete'){
        return {
            tag: {
                text: "Incomplete",
                classes: "govuk-tag--blue"
            }
        }
    } else if(status == 'cannot start'){
        return {
            text: "Cannot start yet",
            classes: "govuk-task-list__status--cannot-start-yet"
        }
    } else {
        return {
            tag: {
                text: "Incomplete",
                classes: "govuk-tag--blue"
            }
        }
    }
}

addFilter('toStatusIndicator', toStatusIndicator)
