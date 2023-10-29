const notFound = (condition, message) => {
  if(!condition) throw new Error(message);

  return true;
}

module.exports = notFound;