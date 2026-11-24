import { MonitoringProfileAssembler } from './monitoring-profile-assembler';

describe('MonitoringProfileAssembler', () => {
  const assembler = new MonitoringProfileAssembler();

  it('keeps the limits of each metric and leaves the missing ones empty', () => {
    const profile = assembler.toEntityFromResource({
      id: 7,
      version: 1,
      updatedAt: '2026-09-08T10:00:00Z',
      thresholds: [{ metric: 'AIR_QUALITY', unit: 'ppm', normalMin: null, normalMax: 600, criticalMin: null, criticalMax: 900 }],
    });

    expect(profile.thresholds[0]).toEqual({
      metric: 'AIR_QUALITY',
      unit: 'ppm',
      normalMin: null,
      normalMax: 600,
      criticalMin: null,
      criticalMax: 900,
    });
  });

  it('uses an empty unit when the API omits it', () => {
    const profile = assembler.toEntityFromResource({
      id: 8,
      version: 2,
      updatedAt: null,
      thresholds: [{ metric: 'TEMPERATURE', normalMin: 15, normalMax: 25, criticalMin: 10, criticalMax: 30 }],
    });

    expect(profile.thresholds[0].unit).toBe('');
  });
});
