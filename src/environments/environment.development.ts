export const environment = {
  production: false,

  // Base API URL
  serverBasePath: 'http://localhost:8080/api/v1',

  // IAM
  iamSignInEndpointPath: '/authentication/sign-in',
  iamSignUpEndpointPath: '/authentication/sign-up',
  iamRecoverPasswordEndpointPath: '/authentication/recover-password',

  // Users / Roles
  usersEndpointPath: '/users',
  rolesEndpointPath: '/roles',

  // Laboratory
  laboratoryLabsEndpointPath: '/laboratories',
  laboratoryStaffEndpointPath: '/staff',
  laboratoryProductsEndpointPath: '/products',
  laboratoryRawMaterialsEndpointPath: '/raw-materials',
  laboratoryEnvironmentsEndpointPath: '/environments',
  laboratoryEnvironmentUsageAssignmentsEndpointPath: '/usage-assignments',

  // Inventory
  inventoryRawMaterialsEndpointPath: '/raw-materials',
  inventoryRawMaterialBatchesEndpointPath: '/batches',
  inventoryRawMaterialBatchReviewsEndpointPath: '/reviews',
  inventoryRawMaterialMovementsEndpointPath: '/movements',
  inventoryRawMaterialUsagesEndpointPath: '/usages',
  inventoryEnvironmentRawMaterialBatchesEndpointPath: '/raw-material-batches',
  inventoryRawMaterialImportsEndpointPath: '/raw-material-imports',
  // Laboratory-wide inventory reads and consumption (deprecated until product batch raw material usages exist)
  inventoryEndpointPath: '/inventory',
  inventoryMaterialsEndpointPath: '/materials',
  inventoryUsableReceiptsEndpointPath: '/usable-receipts',
  inventoryConsumptionsEndpointPath: '/consumptions',
  inventoryLegacyMaterialsEndpointPath: '/legacy-materials',

  // Equipment
  equipmentEndpointPath: '/equipments',
  equipmentBpmConfigEndpointPath: '/bpm-configs',
  equipmentMaintenanceEndpointPath: '/maintenance-records',
  equipmentTelemetryStatusEndpointPath: '/telemetry-status',
  equipmentTelemetryMeasurementsEndpointPath: '/telemetry-measurements',
  equipmentTelemetryHistoryEndpointPath: '/telemetry-history',
  equipmentDeviationTrendsEndpointPath: '/deviation-trends',
  equipmentDeviationAlertsEndpointPath: '/deviation-alerts',
  equipmentComplianceEventsEndpointPath: '/compliance-events',
  equipmentAuditLogsEndpointPath: '/audit-logs',
  equipmentReportsEndpointPath: '/reports',
  equipmentLogReportsEndpointPath: '/log-reports',

  // Batch
  batchEndpointPath: '/batches',
  batchRawMaterialUsageEndpointPath: '/raw-materials',
  batchAuditLogsEndpointPath: '/audit-logs',
  batchDeviationAlertsEndpointPath: '/deviation-alerts',
  batchComplianceEventsEndpointPath: '/compliance-events',
  batchReportsEndpointPath: '/reports',

  // CA
  rawMaterialComplianceEventsEndpointPath: '/compliance-events',
  caNotificationPrefsEndpointPath: '/notification-preferences',

  // RA
  raReportsEndpointPath: '/reports',
  raAuditLogsEndpointPath: '/audit-logs',
  raKpiDashboardsEndpointPath: '/kpi-dashboards',
  raComplianceReportsEndpointPath: '/compliance-reports',

  // Subscriptions & Payments
  subscriptionPlansEndpointPath: '/subscription-plans',
  subscriptionCheckoutSessionsEndpointPath: '/subscription-checkout-sessions',
  subscriptionsEndpointPath: '/subscriptions',
  laboratorySubscriptionsEndpointPath: '/subscriptions',
  laboratoryBillingSummaryEndpointPath: '/billing-summary',

  // Stripe
  stripeWebhooksEndpointPath: '/stripe/webhooks',
};
