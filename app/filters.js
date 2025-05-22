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

/**
 * Returns a JSON stringified version of the value, safe for inclusion in an
 * inline <script> tag. The optional argument 'spaces' can be used for
 * pretty-printing.
 *
 * Output is NOT safe for inclusion in HTML! If that's what you need, use the
 * built-in 'dump' filter instead.
 */

const json = (value, spaces) => {
    // value = value.toString()
    const jsonString = JSON.stringify(value, null, spaces).replace(/</g, '\\u003c')
    return jsonString
}

addFilter('json', json)
