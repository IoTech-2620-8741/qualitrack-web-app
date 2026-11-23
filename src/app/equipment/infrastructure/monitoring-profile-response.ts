/**
 * Environmental profile returned by Tracking, with the fields Equipment Management reads.
 *
 * @remarks
 * Read from `GET /laboratories/{laboratoryId}/environments/{environmentId}/environmental-profile` for an environmental
 * device and from `.../container-monitors/{deviceId}/environmental-profile` for a container monitor.
 */
export interface MonitoringProfileResource {
  id: number;
  version: number;
  updatedAt: string | null;
  thresholds: {
    metric: string;
    unit?: string;
    normalMin: number | null;
    normalMax: number | null;
    criticalMin: number | null;
    criticalMax: number | null;
  }[];
}
