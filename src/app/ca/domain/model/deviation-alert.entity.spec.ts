import { DeviationAlert } from './deviation-alert.entity';

const alertOf = (recordedValue: number, thresholdValue: number, unit: string) =>
  new DeviationAlert({
    id: 1,
    equipmentId: 1,
    parameterName: 'AIR_QUALITY',
    recordedValue,
    thresholdValue,
    unit,
    timestamp: '2026-10-01T10:00:00Z',
    severity: 'CRITICAL',
    status: 'UNRESOLVED',
  });

describe('DeviationAlert.thresholdExcess', () => {
  it('is a percentage of the limit', () => {
    const excess = alertOf(951, 900, 'ppm').thresholdExcess!;

    expect(excess.direction).toBe('above');
    expect(excess.measure).toBe('percent');
    expect(excess.amount).toBeCloseTo(5.67, 2);
  });

  it('tells when the value fell under the limit', () => {
    const excess = alertOf(800, 1000, 'ppm').thresholdExcess!;

    expect(excess.direction).toBe('below');
    expect(excess.amount).toBeCloseTo(20);
  });

  it.each(['°C', 'ºC', 'C', '%'])(
    'is absolute for %s, where a percentage would mislead',
    (unit) => {
      expect(alertOf(12.5, 8, unit).thresholdExcess).toEqual({
        direction: 'above',
        amount: 4.5,
        measure: 'unit',
      });
    },
  );

  it('is absolute when the limit is zero, which has no percentage', () => {
    expect(alertOf(3, 0, 'ppm').thresholdExcess).toEqual({
      direction: 'above',
      amount: 3,
      measure: 'unit',
    });
  });

  it('does not exist when the value is exactly on the limit', () => {
    expect(alertOf(900, 900, 'ppm').thresholdExcess).toBeNull();
  });
});

describe('DeviationAlert.latestDeviation', () => {
  const withDeviations = (deviationCount: number, lastRecordedValue: number | null) =>
    new DeviationAlert({
      id: 1,
      equipmentId: 1,
      parameterName: 'AIR_QUALITY',
      recordedValue: 935,
      thresholdValue: 900,
      unit: 'ppm',
      timestamp: '2026-10-01T10:00:00Z',
      severity: 'CRITICAL',
      status: 'ACKNOWLEDGED',
      deviationCount,
      lastDetectedAt: '2026-11-28T04:12:58Z',
      lastRecordedValue,
    });

  it('is the value and time of the latest deviation of an incident with several', () => {
    expect(withDeviations(5, 2821.8).latestDeviation).toEqual({ value: 2821.8, at: '2026-11-28T04:12:58Z' });
  });

  it('does not exist for a single deviation or an alert stored without that value', () => {
    expect(withDeviations(1, 935).latestDeviation).toBeNull();
    expect(withDeviations(5, null).latestDeviation).toBeNull();
  });
});
