export const environment = {
  production: true,

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
  // Pre-Inventory records pending import, under /laboratories/{laboratoryId}/inventory
  inventoryEndpointPath: '/inventory',
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

  // Product Batch, under /laboratories/{laboratoryId}/environments/{environmentId}
  productsEndpointPath: '/products',
  productBatchesEndpointPath: '/batches',
  batchReleasesEndpointPath: '/releases',
  batchRejectionsEndpointPath: '/rejections',
  batchRawMaterialUsagesEndpointPath: '/raw-material-usages',
  batchEquipmentUsagesEndpointPath: '/equipment-usages',
  batchStaffParticipationsEndpointPath: '/staff-participations',
  batchTraceabilityEndpointPath: '/traceability',
  // Batch records of other bounded contexts, under /batches/{batchId}
  batchEndpointPath: '/batches',
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
