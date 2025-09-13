const { initializeStore, getStore   } = require('./sql_init')
const sql_store = require('./sql')
const { mdb, sequelize   } = require('./db')
const { storeData, getData, getAllData, deleteData   } = require('./syncdb')
const warn = require('./w')
module.exports = { initializeStore,
  getStore,
  sql_store,
  mdb,
  sequelize,
  storeData,
  getData,
  getAllData,
  deleteData,
  warn
  }