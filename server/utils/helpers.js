exports.ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
exports.httpError = (status, message) => Object.assign(new Error(message), { status });
exports.positiveInt = (v, label = 'Quantity') => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw exports.httpError(400, `${label} must be a positive whole number`);
  return n;
};
