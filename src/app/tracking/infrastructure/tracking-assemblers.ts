import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Measurement } from '../domain/model/measurement.entity';
import { ActuationAction, ActuationEvent } from '../domain/model/actuation-event.entity';
import { ActuationRule, EnvironmentalProfile, EnvironmentalThreshold } from '../domain/model/environmental-profile.entity';
import { EnvironmentalState, MonitoredMetric } from '../domain/model/monitored-metric';
import {
  ActuationEventResource,
  ActuationEventsResponse,
  EnvironmentalProfileResource,
  EnvironmentalProfilesResponse,
  MeasurementResource,
  MeasurementsResponse,
} from './tracking-response';

/**
 * Converts the readings of the IoT devices between API resources and domain entities.
 */
export class MeasurementAssembler implements BaseAssembler<Measurement, MeasurementResource, MeasurementsResponse> {
  toEntitiesFromResponse(response: MeasurementsResponse): Measurement[] {
    return response.measurements.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: MeasurementResource): Measurement {
    return new Measurement({
      id: resource.id,
      deviceId: resource.deviceId,
      environmentId: resource.environmentId,
      metric: resource.metric as MonitoredMetric,
      value: resource.value,
      textValue: resource.textValue,
      unit: resource.unit,
      measuredAt: resource.measuredAt,
      state: resource.state as EnvironmentalState | null,
      thresholdValue: resource.thresholdValue,
      profileVersion: resource.profileVersion,
    });
  }

  toResourceFromEntity(entity: Measurement): MeasurementResource {
    return { ...entity, state: entity.state };
  }
}

/**
 * Converts the actions of the container monitors between API resources and domain entities.
 */
export class ActuationEventAssembler implements BaseAssembler<ActuationEvent, ActuationEventResource, ActuationEventsResponse> {
  toEntitiesFromResponse(response: ActuationEventsResponse): ActuationEvent[] {
    return response.actuationEvents.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: ActuationEventResource): ActuationEvent {
    return new ActuationEvent({
      id: resource.id,
      deviceId: resource.deviceId,
      environmentId: resource.environmentId,
      action: resource.action as ActuationAction,
      triggerMetric: resource.triggerMetric as MonitoredMetric | null,
      triggerState: resource.triggerState as EnvironmentalState | null,
      result: resource.result === 'FAILED' ? 'FAILED' : 'EXECUTED',
      occurredAt: resource.occurredAt,
      profileVersion: resource.profileVersion,
    });
  }

  toResourceFromEntity(entity: ActuationEvent): ActuationEventResource {
    return { ...entity };
  }
}

/**
 * Converts the environmental profiles between API resources and domain entities.
 */
export class EnvironmentalProfileAssembler
  implements BaseAssembler<EnvironmentalProfile, EnvironmentalProfileResource, EnvironmentalProfilesResponse> {
  toEntitiesFromResponse(response: EnvironmentalProfilesResponse): EnvironmentalProfile[] {
    return response.profiles.map((resource) => this.toEntityFromResource(resource));
  }

  toEntityFromResource(resource: EnvironmentalProfileResource): EnvironmentalProfile {
    return new EnvironmentalProfile({
      id: resource.id,
      scope: resource.scope === 'ENVIRONMENT' ? 'ENVIRONMENT' : 'CONTAINER_MONITOR',
      environmentId: resource.environmentId,
      deviceId: resource.deviceId,
      version: resource.version,
      thresholds: resource.thresholds.map((threshold): EnvironmentalThreshold => ({
        metric: threshold.metric as MonitoredMetric,
        unit: threshold.unit ?? '',
        normalMin: threshold.normalMin,
        normalMax: threshold.normalMax,
        criticalMin: threshold.criticalMin,
        criticalMax: threshold.criticalMax,
      })),
      actuationRules: resource.actuationRules.map((rule): ActuationRule => ({
        metric: rule.metric as MonitoredMetric,
        state: rule.state === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        action: rule.action as ActuationAction,
      })),
      updatedAt: resource.updatedAt,
    });
  }

  toResourceFromEntity(entity: EnvironmentalProfile): EnvironmentalProfileResource {
    return { ...entity, laboratoryId: 0, updatedBy: null };
  }
}
