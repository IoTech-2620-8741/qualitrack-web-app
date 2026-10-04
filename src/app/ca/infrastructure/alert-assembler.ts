import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { DeviationAlert } from '../domain/model/deviation-alert.entity';
import { AlertDetailResource, AlertResource, AlertsResponse } from './alert-response';

export class AlertAssembler implements BaseAssembler<
  DeviationAlert,
  AlertResource,
  AlertsResponse
> {
  toEntitiesFromResponse(response: AlertsResponse): DeviationAlert[] {
    return response.alerts.map((alert) => this.toEntityFromResource(alert));
  }

  toEntitiesFromResources(resources: AlertResource[]): DeviationAlert[] {
    return resources.map((alert) => this.toEntityFromResource(alert));
  }

  toEntityFromResource(resource: AlertResource | AlertDetailResource): DeviationAlert {
    return new DeviationAlert({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId,
      origin: resource.origin,
      equipmentId: resource.equipmentId,
      batchId: resource.batchId,
      measurementId: resource.measurementId,
      lastMeasurementId: resource.lastMeasurementId,
      parameterName: resource.parameterName,
      recordedValue: resource.recordedValue,
      thresholdValue: resource.thresholdValue,
      unit: resource.unit,
      timestamp: resource.timestamp,
      severity: resource.severity,
      status: resource.status,
      deviationCount: resource.deviationCount,
      lastDetectedAt: resource.lastDetectedAt,
      normalizedAt: resource.normalizedAt,
      acknowledgedBy: resource.acknowledgedBy,
      acknowledgedAt: resource.acknowledgedAt,
      resolvedBy: resource.resolvedBy,
      resolvedAt: resource.resolvedAt,
      resolutionNotes: resource.resolutionNotes,
      relatedActuations: 'relatedActuations' in resource ? resource.relatedActuations : [],
    });
  }

  toResourceFromEntity(entity: DeviationAlert): AlertResource {
    return {
      id: entity.id,
      laboratoryId: entity.laboratoryId,
      environmentId: entity.environmentId,
      origin: entity.origin,
      equipmentId: entity.equipmentId,
      batchId: entity.batchId,
      measurementId: entity.measurementId,
      lastMeasurementId: entity.lastMeasurementId,
      parameterName: entity.parameterName,
      recordedValue: entity.recordedValue,
      thresholdValue: entity.thresholdValue,
      unit: entity.unit,
      timestamp: entity.timestamp,
      severity: entity.severity,
      status: entity.status,
      deviationCount: entity.deviationCount,
      lastDetectedAt: entity.lastDetectedAt,
      normalizedAt: entity.normalizedAt,
      acknowledgedBy: entity.acknowledgedBy,
      acknowledgedAt: entity.acknowledgedAt,
      resolvedBy: entity.resolvedBy,
      resolvedAt: entity.resolvedAt,
      resolutionNotes: entity.resolutionNotes,
    };
  }
}
