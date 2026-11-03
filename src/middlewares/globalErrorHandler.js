export const globalErrorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const status = err.status || 500;
  res.status(status).json({
    message:
      status < 500 || !isProd
        ? err.message
        : 'Something went wrong. Please try again later.',
  });
};
