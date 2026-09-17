const { formatIssueKey } = require('../src/utils/issueKey');

describe('formatIssueKey', () => {
  it('formats a project key and issue number into a display key', () => {
    expect(formatIssueKey('PROJ', 1)).toBe('PROJ-1');
    expect(formatIssueKey('ABC', 42)).toBe('ABC-42');
  });
});
