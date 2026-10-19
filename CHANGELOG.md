# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.2] - 2026-10-10

### Fixed
- System test of the quality manager journey (`tests/system`) aligned with the environment-scoped API: the deviation is reported through the environmental device of an environment, registering an equipment opens its detail view, and the resolve form is validated on submit.

## [1.0.1] - 2026-10-10

### Fixed
- Project report link in `README.md` now points to the correct repository.

## [1.0.0] - 2026-10-10

### Added
- Identity & Access (`iam`): sign up, sign in, onboarding, role-based guards, password recovery with an e-mailed verification code and password change.
- Laboratory Management (`laboratory`): laboratory profile, staff registration, details and deactivation, environments with usage assignments, and raw material details.
- Equipment Management (`equipment`): equipment and device registration, BPM configuration, status changes and maintenance records.
- Inventory Management (`inventory`): raw material catalogue, material registration, raw material batches with quality review, container assignment, movements, usages and imports of pre-inventory records.
- Product Batch Management (`batch`): product catalogue, batch creation, release and rejection, raw material and equipment usage, staff participation, storage assignment and batch traceability.
- Tracking & Telemetry (`tracking`): environmental monitoring, telemetry history, environmental profiles, thresholds and actuation rules.
- Compliance & Alerting (`ca`): deviation alert dashboard, alert history and detail, alert acknowledgement and resolution, in-app notifications and notification preferences.
- Reporting & Audit (`ra`): KPI dashboard, deviation trend charts, audit log viewer, report generator and inventory reports.
- Payments & Subscriptions (`subscription`): plan catalogue, Stripe checkout, payment result pages, billing summary and cancellation requests.
- Profile (`profile`): account and profile of the signed-in user, including the profile photo.
- Shared layout with home, about, dashboard and page-not-found views, and a language switcher for English (`en_US`) and Spanish (`es_419`).
- Frontend class diagrams for every bounded context in `docs/diagrams`.
- Browser tests with Playwright in `tests/` and a system test of the quality manager journey in `tests/system`.
- `README.md` describing features, architecture, environment configuration and testing.

### Changed
- Updated the API endpoint paths in `src/environments` to match the QualiTrack Spring Boot API.
- Raised the production bundle size budget to 1.2MB in `angular.json`.

### Removed
- GitHub Actions workflows from `.github/workflows`.

## [1.2.0] - 2026-10-19

### Added

- Shared form validators in src/app/shared: Peruvian RUC (11 digits starting with 20), DNI (8 digits), mobile and landline phone numbers (sent as +51...), dates (from 2020-01-01), e-mail, person name, code and not-blank validators.
- phoneInput and digitsOnly directives that remove the characters a field does not accept while typing or pasting.
- Unit tests with Vitest for the validators and the forms, the first tests of the repository.

### Fixed

- Laboratory (laboratory): the registration and profile forms validate the RUC, phone and address; the name is limited to 100 characters, as the API requires; the staff form validates the name and the e-mail.
- Profile (profile): the DNI, phone, full name and location are validated, and the phone is sent as +51....
- Identity & Access (iam): sign-up limits the username to 80 characters and requires a dot in the domain of the e-mail.
- Product Batch (batch): the quantity is checked against the unit, dates go from 2020 to today (the start up to one year ahead), and release and rejection dates cannot be earlier than the start of the batch.
- Inventory (inventory): reception and expiration dates are checked and compared, and stock quantities have an upper limit.
- Equipment (equipment): the BPM minimum must be lower than the maximum, the parameter name and unit fit the API, maintenance dates go from 2020 to today in Lima, and device identifiers, serial numbers and firmware versions are validated.
- Reporting & Audit (ra): reports and the audit log require dates from 2020 to today with the end not before the start, and a report covers at most 366 days.
- Tracking & Telemetry (tracking): thresholds must be inside the physical range of each metric, and the telemetry history cannot start before 2020.

