const errorHandler = (err, req, res, next) => {
  // Log the error details (use a logging library like Winston for production)
  console.error(`[ERROR] ${err.message}`, err.stack);

  // Determine the response status code
  const status = err.status || 500;

  // Respond with a JSON error message for API routes or render an error page for others
  if (req.headers['content-type'] === 'application/json' || req.accepts('json') === 'json') {
    res.status(status).json({
      error: {
        message: err.message || 'Internal Server Error',
        details: process.env.NODE_ENV === 'development' ? err.stack : undefined, // Provide stack trace in development
      },
    });
  } else {
    // For HTML responses (e.g., if your app renders views)
    res.status(status).render('error', {
      layout: 'main',
      message: err.message || 'An unexpected error occurred.',
      status,
    });
  }
};

module.exports = { errorHandler };
