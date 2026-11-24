import { MonitoringProfile } from '../domain/model/monitoring-profile.entity';
import { MonitoringProfileResource } from './monitoring-profile-response';

/**
 * Translates the environmental profiles of Tracking into the monitoring profiles of Equipment Management.
 */
export class MonitoringProfileAssembler {
  toEntityFromResource(resource: MonitoringProfileResource): MonitoringProfile {
    return new MonitoringProfile({
      id: resource.id,
      version: resource.version,
      updatedAt: resource.updatedAt ?? null,
      thresholds: resource.thresholds.map((threshold) => ({
        metric: threshold.metric,
        unit: threshold.unit ?? '',
        normalMin: threshold.normalMin ?? null,
        normalMax: threshold.normalMax ?? null,
        criticalMin: threshold.criticalMin ?? null,
        criticalMax: threshold.criticalMax ?? null,
      })),
    });
  }
}
