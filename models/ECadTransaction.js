// ECadTransaction Schema
const mongoose = require("mongoose");

const eCadTransactionSchema = new mongoose.Schema({
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

const ECadTransaction = mongoose.model(
  "ECadTransaction",
  eCadTransactionSchema
);

module.exports = ECadTransaction;
