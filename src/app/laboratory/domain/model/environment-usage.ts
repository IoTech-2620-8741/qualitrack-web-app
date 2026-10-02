/**
 * Main use of an environment of a laboratory or pharmaceutical warehouse.
 *
 * @remarks
 * Mirrors the backend `EnvironmentUsage` enumeration of the Laboratory bounded context.
 */
export type EnvironmentUsage =
  | 'LABORATORY'
  | 'PRODUCTION'
  | 'RAW_MATERIAL_STORAGE'
  | 'PRODUCT_STORAGE'
  | 'OTHER';

/**
 * Allowed environment usages, in the order shown to users.
 */
export const ENVIRONMENT_USAGES: readonly EnvironmentUsage[] = [
  'LABORATORY',
  'PRODUCTION',
  'RAW_MATERIAL_STORAGE',
  'PRODUCT_STORAGE',
  'OTHER',
];
