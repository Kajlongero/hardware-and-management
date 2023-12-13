const notFound = async (condition, message) => {
  throw new Error('not found');
}

module.exports = notFound;