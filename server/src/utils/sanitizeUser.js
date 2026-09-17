// Strips sensitive fields before a user object ever leaves the API
function sanitizeUser(user) {
  if (!user) return user;
  const { passwordHash, ...safe } = user;
  return safe;
}

module.exports = { sanitizeUser };
