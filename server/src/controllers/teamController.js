// Re-exports vault and transactions from questionController for clean routing
const { getVault, getTransactions } = require('./questionController')
module.exports = { getVault, getTransactions }
