const objectErrorMessage = (data) => ({
  message: data.message,
  statusCode: data.status ?? 400,
});

module.exports = objectErrorMessage;