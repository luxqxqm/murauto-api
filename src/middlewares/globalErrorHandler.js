export const globalErrorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  res
    .status(500)
    .json({
      message: isProd
        ? 'Something went wrong. Please try again later.'
        : err.message,
    });
};
