const { MongoMemoryServer } = require('mongodb-memory-server');
const db = require('../../src/db');

let mongod;

module.exports = {
  async start() {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await db.connect(uri);
    return uri;
  },
  async stop() {
    if (mongod) {
      await require('mongoose').disconnect();
      await mongod.stop();
      mongod = null;
    }
  }
};
