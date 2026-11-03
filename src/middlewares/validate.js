// Usage: validate({ body: schema, params: schema, query: schema }), any part is optional
export const validate = (schemas) => (req, res, next) => {
  const errors = [];

  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;

    const result = schemas[part].safeParse(req[part] ?? {});

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push({ field: issue.path.join('.'), message: issue.message });
      }
      continue;
    }

    // In Express 5 req.query is a getter, so it can't be assigned directly
    Object.defineProperty(req, part, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Перевірте введені дані', errors });
  }

  next();
};
