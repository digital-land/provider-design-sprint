//
// For guidance on how to create routes see:
// https://prototype-kit.service.gov.uk/docs/create-routes
//

// original design sprint routes May 24
require('./routes/design-sprint.js')

// initial dashboard designs May 24
require('./routes/overview.js')

// v1 routes for user research session July 24
require('./routes/overview-v1.js')

// v2 routes for user research session July 24
require('./routes/overview-v2.js')

/**********************************************************
 * Integrated Check — 2024-10                             *
***********************************************************/
require('./routes/check.js')

/**********************************************************
 * Iterative Check research routes — 2024-12-09           *
***********************************************************/
require('./routes/iterative-check.js')

/**********************************************************
*  Multiple endpoints — 18 December 2024                  *
***********************************************************/
require('./routes/multiple-endpoints.js')

/**********************************************************
*  Integrated submit — 8 January 2024                     *
***********************************************************/
require('./routes/submit-dataset.js')

/**********************************************************
 * Iterative Check v2 — 2025-01-14                        *
***********************************************************/
require('./routes/iterative-check-v2.js')

/**********************************************************
 * Expectations checks - 2025-02-10                       *
***********************************************************/
require('./routes/expectations.js')

/**********************************************************
 * Landing page iterations - 2025-04-28                   *
***********************************************************/
require('./routes/landing-iteration.js')

/**********************************************************
 * alternative sources - 2025-05-20                       *
***********************************************************/
require('./routes/alternative-sources.js')

/**********************************************************
 * out of bounds - 2025-06-02                             *
***********************************************************/
require('./routes/out-of-bounds.js')

/**********************************************************
 * walkthrough - 2025-07-01                               *
***********************************************************/
require('./routes/walkthrough.js')

/**********************************************************
 * Proxy API routes for map data                          *
***********************************************************/
require('./routes/api.js')