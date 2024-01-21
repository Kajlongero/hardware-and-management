const notFound = async (condition, message) => {
  if(!condition)
    throw new Error(message);
}

module.exports = notFound;