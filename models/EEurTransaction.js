// ECadTransaction Schema
const mongoose = require('mongoose');

const eEurTransactionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const EEurTransactionSchema = mongoose.model('EEurTransactionSchema', eEurTransactionSchema);

module.exports = EEurTransactionSchema;
