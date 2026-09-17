const { hashPassword, comparePassword } = require('../src/utils/password');

describe('password utils', () => {
  it('hashes a password and can verify it against the hash', async () => {
    const hash = await hashPassword('Password123!');
    expect(hash).not.toBe('Password123!');
    await expect(comparePassword('Password123!', hash)).resolves.toBe(true);
    await expect(comparePassword('WrongPassword', hash)).resolves.toBe(false);
  });
});
