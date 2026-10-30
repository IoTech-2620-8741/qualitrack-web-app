# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-10-28

### Changed

- Release: package and lockfile versions are now 2.0.0.

- Tracking (tracking): monitoring, telemetry history, environmental profiles and both configuration editors now own their stylesheets, preserving responsive layouts and reading-state colors (#54).

- Product Batch (batch): each product and batch view keeps its page, form and table styles in its own folder (#54).

- Inventory (inventory): material catalogue, detail, registration and entry views own their stylesheets (#54).

- Compliance & Alerts (ca): alert views, notification settings and the alert table keep their own styles (#54).

- Reporting & Audit (ra): KPI, deviation trend and staff activity views have independent stylesheets (#54).

- Profile (profile): personal and staff profile styles are self-contained (#54).

- Laboratory (laboratory): staff detail owns its page styles (#54).

- Equipment (equipment): the list and device registration view own their stylesheets (#54).

- IAM (iam): password recovery and password change no longer use the sign-in stylesheet; onboarding styles live beside the view (#54).

- Shared (shared): the environment selector has its own CSS file, and README documents stylesheet ownership for views and components (#54).

### Removed

- Presentation: the shared operations, Tracking and Reporting page stylesheets were retired after moving the applicable rules into their consuming views and components (#54).

## [1.3.0] - 2026-10-28

### Added

- CI: the pull request build now runs unit tests (#37). Architecture checks guided the DDD refactor (#38, #39) and are maintained locally; CI continues to require unit tests and the production build (#51).

- Shared (shared): `EnvironmentPreference` remembers in the browser the environment opened in inventory, production and monitoring, with the same keys as before, so nobody loses the remembered environment (#44).

### Changed

- Release: package and lockfile versions are now 1.3.0.

- Licensing: the project uses the QualiTrack Proprietary Software License; package metadata now refers to `LICENSE.md`.

- Profile (profile): the toolbar photo or initials, name and role are now displayed by a Profile component composed by the layout, preserving the profile link and mobile appearance (#45). Quality managers can now open staff photos and personal data on a separate page linked from the staff detail (#46). Notification preferences open from a profile card in Compliance & Alerts; the legacy /profile#notifications link redirects to that page (#47). Route configuration now uses `profile.routes.ts`, preserving public paths (#50).

- IAM (iam): the toolbar session section now only signs out and no longer reads profile data (#45). Password recovery uses the shared HTTP error handler while retaining the same visible failure messages (#50).

- Dependencies: Angular 22.2, Angular Material and CDK 22.2.4, ngx-translate 18.1 and TypeScript 6.0; the component tests now provide the translation service (#36).

- Stores: every store is provided in root, as in the course example, and signing out reloads the application so the next user never sees data of the previous one (#40).

- Shared (shared): the environment selector is now a visual component without a store, and the operational overview (dashboard) moved to Reporting & Audit (#41).

- Product Batch (batch): products and raw material consumption are now kept in `BatchStore` (#40) and the batch path moved to the domain (#39); the equipment (#43), environments, staff and raw material lots a batch uses are now read through the models of Product Batch (#44). Historical consumption links open the preserved material detail in Inventory (#49). Participation and traceability use constructor-based domain classes; route configuration uses `batch.routes.ts` with the same URLs (#50).

- Compliance & Alerts (ca): the notifications of the bell are now kept in `CaStore` (#40); the devices (#43) and environments (#44) of the alerts are now read through the models of Compliance & Alerts. Notification preferences now have their own page, reachable from the profile and toolbar bell (#47). Route configuration now uses `ca.routes.ts`, preserving public paths (#50).

- Equipment (equipment): the environments where equipment is installed and the technicians of a maintenance are now read through the models of Equipment (#44). Route configuration now uses `equipment.routes.ts`, preserving public paths (#50).

- Inventory (inventory): the storage containers (#43) and the environments (#44) are now read through the models of Inventory. Current and historical material consumption also use an Inventory model and endpoint, preserving the warning for production batches affected by observed or rejected receipts (#48). Historical material details now belong to Inventory with its own material snapshot and batch-label models; previous-balance imports remain available (#49). Previous balances use constructor-based domain entities; route configuration uses `inventory.routes.ts` with the same URLs (#50).

- Laboratory (laboratory): the environments are now managed by `LaboratoryStore`, the single store of the context (#44), and the staff member detail is read through it (#39). Staff detail now links to separate profile and activity pages while retaining employment data and deactivation (#46). Historical material URLs redirect to Inventory (#49). Route configuration now uses `laboratory.routes.ts`, preserving public paths and legacy redirects (#50).

- Reporting & Audit (ra): the operational overview shows its data through the models of Reporting & Audit (#41); the equipment of the reports (#43) and the environments and batches of the indicators, trends and reports are read through them too (#44). Staff activity now has its own page with record-type filtering and a staff identity read through an independent Laboratory ACL (#46). Report failures use the shared HTTP error handler while preserving translated messages for JSON and Blob responses; route configuration uses `ra.routes.ts` (#50).

- Tracking & Telemetry (tracking): devices and environments are now read through its own anti-corruption layer (#42). Each telemetry endpoint and assembler has its own file, with separate request types and shared URL/query helpers; route configuration uses `tracking.routes.ts` (#50).

- Subscription (subscription): the view after the payment is now resolved through the IAM store (#39). Route configuration now uses `subscription.routes.ts`, preserving public paths (#50).

### Removed

- Repository tooling: the local architecture checker and exception file are no longer tracked; `tools/` is ignored and its npm command and CI step were removed (#51).

- Laboratory (laboratory): `EnvironmentStore`; Product Batch, Compliance & Alerts, Equipment, Inventory, Reporting & Audit and Tracking & Telemetry no longer import code of Laboratory to read environments and staff (#42, #44). The unused historical material store, model and infrastructure were removed after moving the complete detail to Inventory (#49).

## [1.2.0] - 2026-10-19

### Added

- Unit tests with Vitest for the validators and the forms, the first tests of the repository.
- README.md explaining the context of the frontend project: overview, features, technologies, bounded-context architecture, environment variables and how to run the development server, builds and tests.
- LICENSE.md with the MIT License.

### Changed

- Laboratory (laboratory): the registration and profile forms now validate the RUC, phone and address; the name is now limited to 100 characters, as the API requires; the staff form now validates the name and the e-mail.

- Profile (profile): the DNI, phone, full name and location are now validated, and the phone is now sent as +51....

- Identity & Access (iam): sign-up now limits the username to 80 characters and requires a dot in the domain of the e-mail.

- Product Batch (batch): the quantity is now checked against the unit, dates now go from 2020 to today (the start up to one year ahead), and release and rejection dates can no longer be earlier than the start of the batch.

- Inventory (inventory): reception and expiration dates are now checked and compared, and stock quantities now have an upper limit.

- Equipment (equipment): the BPM minimum must now be lower than the maximum, the parameter name and unit now fit the API, maintenance dates now go from 2020 to today in Lima, and device identifiers, serial numbers and firmware versions are now validated.

- Reporting & Audit (ra): reports and the audit log now require dates from 2020 to today with the end not before the start, and a report now covers at most 366 days.

- Tracking & Telemetry (tracking): thresholds must now be inside the physical range of each metric, and the telemetry history can no longer start before 2020.

## [1.1.1] - 2026-10-12

### Changed

- Internationalization: the English JSON translation file was corrected by adding a missing comma, so the translations load again and the interface shows the texts instead of empty values or visible keys (#14, released in #15).

- Version 1.1.1 set in package.json and package-lock.json, following the release v1.1.0 flow (release branch from develop, merge to main to deploy to Firebase).
  

## [1.1.0] - 2026-10-05

### Added

- Equipment management feature (#6).
- Product Batch management feature (#7).
- Application metadata (#9).
- Laboratory management feature (#10).
- Accessibility improvements for the shared language switcher (#11).
- Release v1.1.0 (#12).

## [1.0.0] - 2026-10-05

### Added

- Profile documentation with TSDoc in Identity & Access (iam) (#2).
- CI: automatic deployment to Firebase Hosting on every push to main (#4).

### Changed

- Angular build: the initial bundle budget error limit was raised to 1.2MB (#1).
- Production environment: the API now points to the Azure Container Apps backend (#3).
- Release v1.0.0 (#5).
