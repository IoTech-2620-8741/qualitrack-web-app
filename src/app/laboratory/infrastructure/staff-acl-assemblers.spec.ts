import { StaffProfileAssembler } from './staff-profile-assembler';
import { StaffActivityAssembler } from './staff-activity-assembler';

describe('Laboratory anti-corruption assemblers of the staff', () => {
  it('keeps only what the detail shows of the Profile resource', () => {
    const profile = new StaffProfileAssembler().toEntityFromResource(
      {
        username: 'ana',
        email: 'ana@example.test',
        fullName: 'Ana Pérez',
        dni: '76204189',
        phoneNumber: null,
        location: 'Lima',
        hasPhoto: true,
        updatedAt: '2026-11-20T10:00:00Z',
        // Fields of the resource Laboratory does not use
        ...({ userId: 4, roles: ['ROLE_OPERATOR'], position: 'Analyst' } as object),
      },
      2,
    );
    expect(profile).toEqual(expect.objectContaining({ id: 2, username: 'ana', dni: '76204189', location: 'Lima' }));
    expect(profile).not.toHaveProperty('roles');
    expect(profile).not.toHaveProperty('position');
  });

  it('keeps the action, record and moment of each audit entry', () => {
    const entry = new StaffActivityAssembler().toEntityFromResource({
      id: 9,
      action: 'RELEASE',
      entityType: 'BATCH',
      entityId: 31,
      timestamp: '2026-11-20T10:00:00Z',
      ...({ performedBy: 4, details: 'Released' } as object),
    });
    expect(entry).toEqual(
      expect.objectContaining({ id: 9, action: 'RELEASE', entityType: 'BATCH', entityId: 31 }),
    );
    expect(entry).not.toHaveProperty('details');
  });
});
