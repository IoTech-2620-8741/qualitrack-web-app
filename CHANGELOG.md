# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Equipment (equipment): a quality manager registers an Edge Gateway, with its identifier and an optional environment, from the equipment list or the side menu.

- Equipment (equipment): the detail of an Edge Gateway shows whether it has an API key and lets a quality manager generate it once it is located and operational; the key is shown only once, in a dialog with copy buttons, and is not kept in the app.

- Equipment (equipment): each environment has a view with its Edge Gateways, how many IoT devices each one covers (up to 15), its devices and process equipment, and a warning when some devices have no Edge Gateway, with a button that registers one already located there.

- Equipment (equipment): the equipment list filters by environment (also with `?environmentId=`) and by Edge Gateways, and its summary counts the equipment, devices and Edge Gateways of the chosen environment.

### Changed

- Equipment (equipment): an Edge Gateway is no longer counted or shown as process equipment, and its type is translated instead of showing `EDGE_GATEWAY`.

- Laboratory (laboratory): the code of each environment in the environment list opens the equipment of that environment.

## [2.4.0] - 2026-11-09

### Changed

- Release: package and lockfile versions are now 2.4.0.

### Fixed

- Subscription (subscription): the billing summary calls the start of the current period "Current Period From" instead of "Started At", which read as the day the subscription began; after a renewal it shows the renewal day (#98).

## [2.3.0] - 2026-11-09

### Added

- Product Batch (batch): on a phone, where the batch cards hide the headers of the table, two lists above them choose the column and the direction of the order (#93).

- Product Batch (batch): the batch list shows indicators by status that also filter it, a search by batch number or product, an environment filter, a start date range, sorting and 10, 25 or 50 batches per page (#91).

- Product Batch (batch): the detail of a batch has a heading with its status and a summary of the product, environment, quantity and dates, and its traceability shows a timeline of the batch next to its tables (#91).

- Product Batch (batch): the batch views name who registered each step, and mark the current user with "(you)", instead of showing a user id (#91).

- Subscription (subscription): when someone who already pays for a plan arrives from a website plan link with another one, the dashboard opens a notice that names both plans, says when the current period ends and sends them to Billing to cancel the renewal, since the platform has no direct plan switch.

- Identity & Access (iam): the sign-up page keeps the plan of the website link (`plan` and `billingCycle`) even when the person goes on to sign in, so the checkout of that plan opens after signing in.

- Subscription (subscription): a plan chosen on the website (`plan` and `billingCycle` in the link) is remembered by `planPreselectionGuard`; the plans view sends an account without a subscription straight to the checkout of that plan, leaving the checkout or signing out forgets it.

### Changed

- Release: package and lockfile versions are now 2.3.0.

- Inventory (inventory): reloading the catalogue asks again for the low stock and the lots near expiry shown, and answers of earlier requests or of an environment that was left are ignored (#92).

- Inventory (inventory): the counts of the catalogue are a component of their own, and the inventory home page has its own template (#92).

- Compliance & Alerts (ca): the alert history says that "Export report" covers the whole period and environment when a chip or the search narrows the table (#90).

- Subscription (subscription): the root routes compose the guard of the plan link and the plan switch notice, so `iam` and `ra` no longer import `subscription`; a plan link is remembered on every IAM page (#89).

- Inventory (inventory): the raw material, catalogue and legacy views are split into 14 components that receive their data and report what the user asks for (#88).

- Presentation: the views share one visual language, with cards, titles with an icon, pill buttons and tables that become cards on a phone; the logo no longer has empty margins, and the alerts and the report generator no longer show breadcrumbs (#81).

- Shared (shared): the colors of the component styles use the design tokens again, with new `--qt-primary-hover`, `--qt-primary-soft`, `--qt-heading` and `--qt-text-subtle` tokens (#82).

- Compliance & Alerts (ca): "Export report" in the alert history opens the report generator with an environmental compliance report of the same environment and period.

- Reporting & Analytics (ra): the report generator reads `type`, `environmentId`, `from` and `to` from the address, so another view can prepare the form.

- Compliance & Alerts (ca): the alert history shows the alerts, the share resolved and the average attention and resolution times of the filter, and a weekly chart of stacked bars by severity with a table for screen readers.

- Compliance & Alerts (ca): the detail of an alert opens over the alert history, at `/alerts/history/:alertId`, and closing it goes back to the history with its filter.

- Shared: `app-filter-chip` is a chip that can be pressed and tells how many results it leaves.

- Compliance & Alerts (ca): the alert history filters by period, severity, status, origin and text with chips that show their counts, custom days and 25 alerts per page; the filter stays in the address, so going back, reloading or sharing the page keeps it.

- Compliance & Alerts (ca): the table of the alert history shows how long each alert lasted, who resolved it and its corrective action, and an empty state when nothing matches.

- Compliance & Alerts (ca): the alert history can be filtered on the client by period, severity, status, origin and text, with `filterAlertHistory`.

- Compliance & Alerts (ca): `summarizeAlertHistory` counts the alerts of the history by severity and averages their attention and resolution times.

- Compliance & Alerts (ca): `countAlertsByWeek` counts the alerts of the history in weeks that start on Monday in Peru, by severity, for the weekly chart.

- Compliance & Alerts (ca): `CaStore.loadAlertHistory` reads every alert, open or resolved, of one environment or of the whole laboratory; an environment that fails does not hide the others.

### Removed

- Presentation: 356 custom properties this version of Angular Material does not read, and the rules no element of their component can match (#82).

### Fixed

- Subscription (subscription): while the laboratory pays for a plan, the plans view no longer offers buttons that do nothing. The card of the paid plan says it is the current plan and when it renews or ends, the view opens on its billing period, and the other plans link to Billing, where the renewal is cancelled (#95).

- Subscription (subscription): the icon of the already-active notice of the plans view no longer shrinks on narrow screens (#95).

- Inventory (inventory): while the low stock or the lots near expiry are loading, the catalogue says so instead of "No materials match this view." or "No lots expire soon in this environment." (#93).

- Product Batch (batch): a click anywhere on the start date range of the batch list, also on its label, opens the calendar (#93).

- Product Batch (batch): on a phone the summary of a batch gives the product and the environment the whole width, so their names are no longer split in the middle of a word (#93).

- Subscription (subscription): the checkout of an account that already has a subscription shows the translated already-active notice instead of a generic conflict message.

- Laboratory (laboratory): the action columns of the staff and environment lists are only offered to quality managers again (#82).

- Compliance & Alerts (ca): on a phone the title of the alerts no longer splits a word, the sort options wrap and the export link fits, and the alert table scrolls inside its own area on every width that does not show cards (#82).

- Product Batch (batch), Inventory (inventory) and Laboratory (laboratory): the product catalog actions, the tables of a raw material and the staff table keep their words whole on a tablet (#82).

- Reporting & Analytics (ra): the styles of the subscription section no longer end in a cut rule (#82).

- Shared (shared): the application stays in Roboto instead of falling back to the font of the system (#82).

- Shared (shared): the browser tab no longer keeps the title of the previous page. Every page has a title in the language of the application, in the format `Page - QualiTrack` (#83).

- Compliance & Alerts (ca): the view action of the alert history shows only the eye icon again, with its words as label and tooltip (#84).

- Inventory (inventory): the "Changes saved" message stays visible after the reload that follows a change, and opening another environment no longer shows the data of the previous one (#88).

- Inventory (inventory), Product Batch (batch): leaving the inventory home, the product home or a link to a batch while it loads no longer pulls you back to the page it was about to open (#89).

- Compliance & Alerts (ca): typing a date in the custom period of the alert history no longer freezes the page or leaves a step per digit in the browser history, and a day that does not exist in the address no longer breaks the view (#90).

## [2.2.0] - 2026-11-04

### Added

- Shared (shared): the `dateOnly` pipe shows a day in the single date format of the application; a calendar day stays as it is, whatever the time zone (#75).

### Changed

- Release: package and lockfile versions are now 2.2.0.

- Compliance & Alerts (ca): the alert history uses `AlertsPageHeader`, with the same tabs as the active alerts, and opens the environment of the address (#75).

- Subscription (subscription): the plans explain how to switch plans, by canceling the renewal and choosing another one when the period ends, and the button of the billing summary reads "View Plans" (#75).

- Reporting & Audit (ra): the components of the dashboard use the models of the context instead of `any` (#75).

- Tests: the browser checks follow the current screens and endpoints; the ones that create accounts through the real API only run with `LOCAL_API=1` (#75).

### Removed

- Documentation: the README section about a system test that is not in the repository (#75).

### Fixed

- IAM (iam): the home page, sign-in, sign-up and password recovery are only for visitors. Whoever still has a session goes to the dashboard, instead of seeing the signed-in user next to the sign-in button (#75).

- Internationalization: every date follows the chosen language and the time zone of the laboratories, instead of the US format and the time zone of the browser (#75).

- Environments: the views read the environments every time they open, so a new one appears without reloading the page, and the inbox reads its alerts as soon as it appears (#75).

- Reporting & Audit (ra): the period buttons of the deviation indicators fit on small phones (#75).

## [2.1.0] - 2026-11-04

### Added

- Shared (shared): `EmptyState`, `ErrorBanner` and `DashboardState` show empty lists, failures with a retry and the loading state of each part of a page (#59, #60).

- Shared (shared): design tokens of the style guide (`--qt-*`) and the `.qt-theme` class for the pages that adopt them; `StatusChip` shows a status with color, icon and text; `UndoToast` gives a few seconds to undo an action, with a progress bar that stops under the pointer or the focus; the `dateTime` and `relativeTime` pipes format every date the same way, in the chosen language and the time zone of the laboratories; `EnvironmentSelector` can offer an option for every environment (#68).

- Shared (shared): `StatFilterCard` is a summary figure that works as a filter; `ActionBanner` tells what needs attention and offers the way to deal with it; `EmptyState` can have a title, a positive tone and actions (#70).

- Compliance & Alerts (ca): `AlertsPageHeader` with the breadcrumb, the notification preferences and the Active and History tabs, and `alert-chips` with the chip of each severity and status (#68).

- Compliance & Alerts (ca): the active alerts are a prioritized inbox across every environment, with `AlertCard`, a banner for the critical alerts nobody attends, summary figures that filter, search, three orders and a positive empty state. An environment can be chosen through `?environmentId=`, and one that cannot be read is named without hiding the others (#70).

- Compliance & Alerts (ca): the inbox refreshes itself every 30 seconds while the tab is visible and announces the alerts that arrive (#70).

- Compliance & Alerts (ca): registering attention from the inbox can be undone for 5 seconds. The request is sent when that time ends, when the person moves on with the alert, signs out or leaves the page (#70).

- Shared (shared): `SidePanel` opens a modal panel over the whole application, keeps the focus inside, closes with Escape and gives the focus back; the `elapsedTime` pipe tells how long passed between two instants (#71).

- Compliance & Alerts (ca): `AlertTimeline` tells what happened to an alert in order and what is still missing; `AlertResolutionForm` closes it with a corrective action, with templates that can be edited. Alerts name who attended and resolved them instead of their account number (#71).

- Reporting & Audit (ra): the environmental summary evaluates each card against the thresholds of its device, with a state and the range of the readings, and can be seen as a table (#65).

- Reporting & Audit (ra): the deviation indicators have a detail page for each variable, `/reports/deviation-trends/:equipmentId/:parameter`, with its events filtered by date and condition. The environment, the period and the variable chosen stay in the address (#69).

- Compliance & Alerts (ca): with the focus on the inbox, J and K move between the cards and A registers attention, which can be undone (#71).

### Changed

- Release: package and lockfile versions are now 2.1.0.

- Shared (shared): `EnvironmentSelector` shows the whole name of the chosen environment, in two lines if needed (#70).

- Compliance & Alerts (ca): the detail of an alert is a panel over the inbox, which stays as it was; `/alerts/:alertId` opens it and closing goes back to where the person came from. Attention registered in the panel can be undone too, and a resolved alert only reads (#71).

- Compliance & Alerts (ca): the active alerts page uses `AlertsPageHeader`. In Spanish the critical severity reads "Crítica"; in English "Being attended" becomes "In progress" and "Condition back to normal" becomes "Condition normalized" (#68).

- Shared (shared): the side menu groups its options by how often the laboratory uses them: operation, quality and administration (#67).

- Reporting & Audit (ra): the environmental summary and the deviation indicators are split into smaller components, and the chart draws the limits of the variable as zones (#65, #69).

- Subscription (subscription): the plans choose the billing period with a toggle and mark the recommended plan; the plans, checkout, payment results and billing views share one design (#66).

- Routing: every bounded context now uses semantic routes that name the resource instead of the view (#57):
  - Equipment (equipment): `/equipments`, `/equipments/new`, `/equipments/devices/new`, `/equipments/:equipmentId`, `/equipments/:equipmentId/bpm-configuration` and `/equipments/:equipmentId/maintenances/new`.
  - Compliance & Alerts (ca): `/alerts` (active alerts), `/alerts/history` and `/alerts/:alertId`.
  - Reporting & Audit (ra): `/reports/kpis`, `/reports/new` and `/reports/staff/:staffId/activity`.
  - Laboratory (laboratory): `/laboratories/new`, `/laboratories/profile`, `/laboratories/staff` and `/laboratories/staff/new`.
  - Product Batch (batch): `/batches` lists every batch, `/batches/environments` opens the product catalogue and `/batches/:batchId` resolves the full batch path.
  - Tracking (tracking): `/tracking/monitoring`.
  - Subscription (subscription): `/subscriptions/billing`.

- Shared (shared): the side menu highlights only the most specific sub-option of the current URL (#57).

- Shared (shared): `shared` no longer imports any bounded context. The root component wraps every page in the layout and projects the notification bell, the profile badge and the sign-out action into it; the home page receives the sign-in section from its route (#58).

- Reporting & Audit (ra): the audit log, the operational overview and the report generator are split into smaller components (#59, #60, #61). The report generator works in two steps, report type and then its parameters, and can preview a PDF before downloading it (#61).

- Compliance & Alerts (ca) and Reporting & Audit (ra): the "View detail" link of the alert tables and the report preview button only show the eye icon; their words stay as the tooltip and the accessible name (#62).

### Deprecated

- Routing: the view-named paths (`equipment-list`, `deviation-detail/:id`, `batch-list`, `lab-profile`, `kpi-dashboard`, `billing-summary` and the rest) only redirect to their semantic route and will be removed in a future major version (#57).

### Removed

- Shared (shared): the `Toolbar` component, unused since the layout wraps every page (#62).

- Compliance & Alerts (ca): the `DeviationDetail` view, replaced by the detail panel (#71).

### Fixed

- Shared (shared): the logo leads to the home page again before signing in, `/about` shows a single toolbar and the not-found page offers the dashboard to signed-in users (#62).

- Compliance & Alerts (ca): visitors no longer request the unread notification count every 30 seconds; the bell is created only with operational access (#62).

- Reporting & Audit (ra): the report preview generates the report once; downloading it from the preview, or again with the same parameters, reuses that file instead of storing another report. A failed preview shows its translated message, the preview dialog shows its title and a download button, and the "report downloaded" message is shown again (#63).

- Internationalization: the close label of dialogs and error banners exists in English and Spanish (#63).

- Routing: the layout no longer renders twice inside the bounded contexts (#67).

- Shared (shared): the side menu keeps its option active when the address has query parameters (#72).

- Reporting & Audit (ra): the deviation chart only draws the limits configured for the variable, on both sides of the range, instead of inventing them when there is no profile, and its axis follows readings below zero (#72).

- Reporting & Audit (ra): the fixed "Goal 95% · meets" text is gone, because it did not depend on the value and the report defines no such goal; without enough readings the time in range is shown as unknown instead of 0% (#72).

- Reporting & Audit (ra): the environmental summary names the device of each card, its state is the worst the readings reached in the period instead of the one of the average, which could say normal after critical readings, a normal state reads "Normal" and the range is translated. Each environmental profile is read once and for the right kind of device, even if the equipment answers late (#72).

- Reporting & Audit (ra): choosing a row of the deviation indicators no longer reloads the page, and each change of environment or period reads the trends once. A deviation event tells the limit it crossed, also the lower one. The dates of the summary and of the events follow the chosen language and the time zone of the laboratories (#72).

- Reporting & Audit (ra): the report generator and the period filters of the environmental summary fit on phones. An invalid period tells what is wrong with it instead of showing a translation key, and the hint gives the real limit of 366 days (#72).

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
