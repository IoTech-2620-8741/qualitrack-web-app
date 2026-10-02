import { EnvironmentUsage } from '../domain/model/environment-usage';

/**
 * Request payload for `POST /laboratories/{laboratoryId}/environments`.
 */
export interface CreateEnvironmentRequest {
  code: string;
  name: string;
  description: string | null;
}

/**
 * Request payload for `PUT /laboratories/{laboratoryId}/environments/{environmentId}`.
 */
export interface UpdateEnvironmentRequest {
  code: string;
  name: string;
  description: string | null;
}

/**
 * Request payload for `POST /laboratories/{laboratoryId}/environments/{environmentId}/usage-assignments`.
 */
export interface AssignEnvironmentUsageRequest {
  usage: EnvironmentUsage;
}
