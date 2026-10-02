import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { EnvironmentUsage } from '../domain/model/environment-usage';

/**
 * Resource representation of an environment returned by the backend.
 *
 * @remarks
 * Mirrors `EnvironmentResource` of
 * `GET /api/v1/laboratories/{laboratoryId}/environments`.
 */
export interface EnvironmentResource extends BaseResource {
  id: number;
  laboratoryId: number;
  code: string;
  name: string;
  description: string | null;
  usage: EnvironmentUsage | null;
  usageAssignedBy: number | null;
  usageAssignedAt: string | null;
}

/**
 * Resource returned when a usage is assigned to an environment.
 *
 * @remarks
 * Mirrors `EnvironmentUsageAssignmentResource` of
 * `POST /api/v1/laboratories/{laboratoryId}/environments/{environmentId}/usage-assignments`.
 */
export interface EnvironmentUsageAssignmentResource {
  environmentId: number;
  laboratoryId: number;
  usage: EnvironmentUsage;
  assignedBy: number | null;
  assignedAt: string;
}

/**
 * Response envelope for environment collections.
 */
export interface EnvironmentsResponse extends BaseResponse {
  environments: EnvironmentResource[];
}
