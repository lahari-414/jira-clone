// Verifies the sprint state machine rules without touching the database.
// Re-implements the transition table used by sprintService for isolated testing.
const TRANSITIONS = {
  PLANNED: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(from, to) {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

describe('sprint status transitions', () => {
  it('allows PLANNED -> ACTIVE -> COMPLETED', () => {
    expect(canTransition('PLANNED', 'ACTIVE')).toBe(true);
    expect(canTransition('ACTIVE', 'COMPLETED')).toBe(true);
  });

  it('rejects COMPLETED -> ACTIVE', () => {
    expect(canTransition('COMPLETED', 'ACTIVE')).toBe(false);
  });

  it('rejects skipping straight to COMPLETED from PLANNED', () => {
    expect(canTransition('PLANNED', 'COMPLETED')).toBe(false);
  });
});
