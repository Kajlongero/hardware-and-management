const path = require('path');
const { logPath } = require('../logs/path.js');
const { randomUUID } = require('crypto');
const { writeFile, readFile, readdir, writev } = require('fs');

const writeLog = async (data, type) => {
  const now = new Date().getTime();

  await writeFile(`${logPath}/${now}-${type}.txt`, JSON.stringify(data), (err) => {
    if(err) console.error('error writing log');
  });

  return `${logPath}/${now}-${type}`;
}

const readLog = async (filename) => {
  
}

const createLogJson = ({ type, description, statusCode, producedBy, aditionalInfo }) => ({
  id: randomUUID(),
  type,
  description,
  statusCode,
  producedBy,
  aditionalInfo,
  iat: new Date().getDate(),
});
 
module.exports = { writeLog, readLog, createLogJson };