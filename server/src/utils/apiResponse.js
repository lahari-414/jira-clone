// Consistent success response shape: { success: true, data: {...} }
function success(res, data = {}, statusCode = 200, meta = undefined) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
}

module.exports = { success };
