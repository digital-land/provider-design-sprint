# Planning Data Providers Prototype

## Overview

 This is a prototype of the [Planning Data](https://www.planning.data.gov.uk/) provider's service. It is not a live service and is not intended for use in production. The prototype is being used to test the design and functionality of the service with users.

The service is being developed by the [Digital Planning team](https://mhclgdigital.blog.gov.uk/category/digital-planning/) at the Ministry of Housing, Communities and Local Government (MHCLG).

These designs are documented in our [design history](https://submit-planning-data.designhistory.app/).

## Getting Started

### Prerequisites
- Node.js (v18 or later recommended)
- npm
- Docker (optional, for containerised development)

### Installation
1. Clone the repository:
   ```sh
   gh repo clone digital-land/provider-design-sprint
   cd provider-design-sprint
   ```
2. Install dependencies:
   ```sh
   npm install
   ```

### Running the Prototype
- Start the app locally:
  ```sh
  npm run dev
  ```
- the app will be available at `http://localhost:3000` by default.
- webpack is used to bundle the maplibre javascript code
- the app uses concurrently to run `webpack --watch` alongside the prototype kit 

## Project Structure
- `app/` – Main application code
- `app/data` - Dummy data used in the prototype
- `app/routes` - Routes files have been split out into separate files to reduce the overall files size
- `app/views` - different designs and experiments sorted into folders
- `app/views/common` - Common pages that are reused across different designs
- `webpack.config.mjs` – Asset bundling config

## Deployment

The app is deployed automatically to Amazon App Runner when the main branch is updated

## Licence
See `LICENCE.txt` for details.

## Contact
For questions or feedback, contact the project team at planning.data@communities.gov.uk

---
_Last updated: 30 June 2025_