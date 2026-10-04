export const environment = {
  production: false,

  // Base API URL
  serverBasePath: 'http://localhost:8080/api/v1',

  // IAM
  iamSignInEndpointPath: '/authentication/sign-in',
  iamSignUpEndpointPath: '/authentication/sign-up',
  iamRecoverPasswordEndpointPath: '/authentication/password-recovery-requests',

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
  // Records of an equipment, under /laboratories/{laboratoryId}/equipments/{equipmentId}
  equipmentBpmConfigEndpointPath: '/bpm-configs',
  equipmentTelemetryStatusEndpointPath: '/telemetry-status',
  equipmentTelemetryMeasurementsEndpointPath: '/telemetry-measurements',
  equipmentTelemetryHistoryEndpointPath: '/telemetry-history',
  equipmentDeviationTrendsEndpointPath: '/deviation-trends',
  equipmentDeviationAlertsEndpointPath: '/deviation-alerts',
  equipmentComplianceEventsEndpointPath: '/compliance-events',
  equipmentAuditLogsEndpointPath: '/audit-logs',
  // Under /laboratories/{laboratoryId}/environments/{environmentId}/equipments/{equipmentId} (TS86)
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
  deviationAlertsEndpointPath: '/deviation-alerts',
  deviationAlertAcknowledgementsEndpointPath: '/acknowledgements',
  deviationAlertResolutionsEndpointPath: '/resolutions',
  caNotificationPrefsEndpointPath: '/notification-preferences',

  // RA
  raReportsEndpointPath: '/reports',
  raReportContentEndpointPath: '/content',
  raAuditLogsEndpointPath: '/audit-logs',
  raKpiDashboardsEndpointPath: '/kpi-dashboards',
  raComplianceReportsEndpointPath: '/compliance-reports',

  // Subscriptions & Payments
  subscriptionPlansEndpointPath: '/subscription-plans',
  subscriptionCheckoutSessionsEndpointPath: '/subscription-checkout-sessions',
  subscriptionsEndpointPath: '/subscriptions',
  laboratorySubscriptionsEndpointPath: '/subscriptions',
  subscriptionCancellationRequestsEndpointPath: '/cancellation-requests',

  // Stripe
  stripeWebhooksEndpointPath: '/stripe/webhooks',
};
