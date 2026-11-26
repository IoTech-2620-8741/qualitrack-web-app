import { configurableMetricsOf, metricDefinition, metricsOf, METRICS } from './monitored-metric';

describe('monitored metrics', () => {
  it('give the environmental device its air quality, motion and the luminosity of the room', () => {
    expect(metricsOf('ENVIRONMENTAL_DEVICE').map((definition) => definition.metric)).toEqual([
      'AIR_QUALITY',
      'MOTION',
      'LUMINOSITY',
    ]);
  });

  it('let the environment profile configure the air quality and the luminosity', () => {
    expect(configurableMetricsOf('ENVIRONMENTAL_DEVICE').map((definition) => definition.metric)).toEqual([
      'AIR_QUALITY',
      'LUMINOSITY',
    ]);
  });

  it('keep the temperature, humidity and luminosity of the container monitor', () => {
    expect(configurableMetricsOf('CONTAINER_MONITOR').map((definition) => definition.metric)).toEqual([
      'TEMPERATURE',
      'HUMIDITY',
      'LUMINOSITY',
    ]);
  });

  it('share only the luminosity between both device types', () => {
    const shared = METRICS.filter((definition) => definition.deviceTypes.length > 1).map((definition) => definition.metric);
    expect(shared).toEqual(['LUMINOSITY']);
    expect(metricDefinition('LUMINOSITY')?.unit).toBe('lux');
  });
});
