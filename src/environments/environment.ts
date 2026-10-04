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
  // Password change of the signed-in user, under /users
  currentUserPasswordChangesEndpointPath: '/me/password-changes',
  rolesEndpointPath: '/roles',

  // Laboratory
  laboratoryLabsEndpointPath: '/laboratories',
  laboratoryStaffEndpointPath: '/staff',
  laboratoryStaffDeactivationsEndpointPath: '/deactivations',
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

  // Equipment, under /laboratories/{laboratoryId} and .../environments/{environmentId}
  equipmentEndpointPath: '/equipments',
  equipmentStatusChangesEndpointPath: '/status-changes',
  equipmentMaintenanceEndpointPath: '/maintenance-records',
  devicesEndpointPath: '/devices',
  environmentalDevicesEndpointPath: '/environmental-devices',
  containerMonitorsEndpointPath: '/container-monitors',
  // Flat routes under /equipments/{equipmentId} kept until the Compliance and Reporting phases
  equipmentBpmConfigEndpointPath: '/bpm-configs',

  // Tracking, under .../environments/{environmentId}[/container-monitors/{deviceId} | /devices/{deviceId}]
  trackingTelemetryStatusEndpointPath: '/telemetry-status',
  trackingTelemetryMeasurementsEndpointPath: '/telemetry-measurements',
  trackingActuationEventsEndpointPath: '/actuation-events',
  trackingEnvironmentalProfileEndpointPath: '/environmental-profile',
  trackingThresholdsEndpointPath: '/thresholds',
  trackingActuationRulesEndpointPath: '/actuation-rules',
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
