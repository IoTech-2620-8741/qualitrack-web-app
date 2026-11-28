/** Records the platform names in the activity of a staff member; any other one is shown as the server sends it. */
const KNOWN_ENTITIES = new Set([
  'BATCH',
  'BPM_PARAMETER_CONFIG',
  'DEVIATION_ALERT',
  'ENVIRONMENT',
  'EQUIPMENT',
  'EQUIPMENT_TELEMETRY_STATUS',
  'ENVIRONMENTAL_PROFILE',
  'LABORATORY',
  'MAINTENANCE_RECORD',
  'NOTIFICATION_PREFERENCE',
  'PHARMACEUTICAL_PRODUCT',
  'RAW_MATERIAL',
  'RAW_MATERIAL_BATCH',
  'RAW_MATERIAL_USAGE',
  'STAFF_MEMBER',
  'TELEMETRY_ANOMALY',
  'TELEMETRY_HISTORY_POINT',
  'TELEMETRY_MEASUREMENT',
]);

/** Actions the platform names in the activity of a staff member. */
const KNOWN_ACTIONS = new Set([
  'CREATE',
  'UPDATE',
  'DELETE',
  'RELEASE',
  'REJECT',
  'APPROVE',
  'REGISTER',
  'REMOVE',
  'EXPORT',
  'GENERATE',
]);

/**
 * Translation key of the type of record of an activity entry.
 *
 * @param entityType - Type of record sent by the server, such as `BATCH`
 * @returns The translation key, or null for a type the platform does not name yet
 */
export function activityEntityKey(entityType: string): string | null {
  return KNOWN_ENTITIES.has(entityType) ? `staff.activity.entities.${entityType.toLowerCase()}` : null;
}

/**
 * Translation key of the action of an activity entry.
 *
 * @param action - Action sent by the server, such as `REGISTER`
 * @returns The translation key, or null for an action the platform does not name yet
 */
export function activityActionKey(action: string): string | null {
  return KNOWN_ACTIONS.has(action) ? `staff.activity.actions.${action.toLowerCase()}` : null;
}
