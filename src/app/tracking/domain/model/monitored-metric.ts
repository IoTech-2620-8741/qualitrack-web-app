import { IotDeviceType } from '../../../equipment/domain/model/iot-device-type';

/**
 * Quantity reported by an IoT device. The environmental device reports the air quality and the motion of the
 * environment; a container monitor reports temperature, humidity, luminosity and the RFID tag it reads.
 */
export type MonitoredMetric = 'AIR_QUALITY' | 'MOTION' | 'TEMPERATURE' | 'HUMIDITY' | 'LUMINOSITY' | 'RFID_TAG';

/**
 * NORMAL, WARNING or CRITICAL condition of a metric evaluated with the profile in force.
 */
export type EnvironmentalState = 'NORMAL' | 'WARNING' | 'CRITICAL';

/**
 * Description of a metric: its unit, the device that reports it and whether it accepts thresholds.
 */
export interface MetricDefinition {
  metric: MonitoredMetric;
  unit: string;
  deviceType: IotDeviceType;
  /** Whether the quality manager configures WARNING/CRITICAL thresholds for it. */
  configurable: boolean;
  /** Whether the metric is usually limited only from above, like the air quality. */
  upperOnly: boolean;
}

export const METRICS: readonly MetricDefinition[] = [
  { metric: 'AIR_QUALITY', unit: 'ppm', deviceType: 'ENVIRONMENTAL_DEVICE', configurable: true, upperOnly: true },
  { metric: 'MOTION', unit: 'event', deviceType: 'ENVIRONMENTAL_DEVICE', configurable: false, upperOnly: false },
  { metric: 'TEMPERATURE', unit: '°C', deviceType: 'CONTAINER_MONITOR', configurable: true, upperOnly: false },
  { metric: 'HUMIDITY', unit: '%RH', deviceType: 'CONTAINER_MONITOR', configurable: true, upperOnly: false },
  { metric: 'LUMINOSITY', unit: 'lux', deviceType: 'CONTAINER_MONITOR', configurable: true, upperOnly: false },
  { metric: 'RFID_TAG', unit: 'tag', deviceType: 'CONTAINER_MONITOR', configurable: false, upperOnly: false },
];

/** Metrics reported by a device type. */
export function metricsOf(deviceType: IotDeviceType): MetricDefinition[] {
  return METRICS.filter((definition) => definition.deviceType === deviceType);
}

/** Metrics of a device type whose thresholds can be configured. */
export function configurableMetricsOf(deviceType: IotDeviceType): MetricDefinition[] {
  return metricsOf(deviceType).filter((definition) => definition.configurable);
}

export function metricDefinition(metric: string): MetricDefinition | undefined {
  return METRICS.find((definition) => definition.metric === metric);
}
