# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-10-19

### Added

- Shared form validators in src/app/shared: Peruvian RUC (11 digits starting with 20), DNI (8 digits), mobile and landline phone numbers (sent as +51...), dates (from 2020-01-01), e-mail, person name, code and not-blank validators.
- phoneInput and digitsOnly directives that remove the characters a field does not accept while typing or pasting.
- Unit tests with Vitest for the validators and the forms, the first tests of the repository.
- README.md explaining the context of the frontend project: overview, features, technologies, bounded-context architecture, environment variables and how to run the development server, builds and tests.
- LICENSE.md with the MIT License.

### Fixed

- Laboratory (laboratory): the registration and profile forms validate the RUC, phone and address; the name is limited to 100 characters, as the API requires; the staff form validates the name and the e-mail.
- Profile (profile): the DNI, phone, full name and location are validated, and the phone is sent as +51....
- Identity & Access (iam): sign-up limits the username to 80 characters and requires a dot in the domain of the e-mail.
- Product Batch (batch): the quantity is checked against the unit, dates go from 2020 to today (the start up to one year ahead), and release and rejection dates cannot be earlier than the start of the batch.
- Inventory (inventory): reception and expiration dates are checked and compared, and stock quantities have an upper limit.
- Equipment (equipment): the BPM minimum must be lower than the maximum, the parameter name and unit fit the API, maintenance dates go from 2020 to today in Lima, and device identifiers, serial numbers and firmware versions are validated.
- Reporting & Audit (ra): reports and the audit log require dates from 2020 to today with the end not before the start, and a report covers at most 366 days.
- Tracking & Telemetry (tracking): thresholds must be inside the physical range of each metric, and the telemetry history cannot start before 2020.

## [1.1.1] - 2026-10-12

### Fixed

- Internationalization: a missing comma in the English JSON translation file prevented the translations from loading, which left empty texts or visible keys in the interface (#14, released in #15).
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
