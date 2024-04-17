const express = require("express");
const mongoose = require("mongoose");
const ECadTransaction = require("./models/ECadTransaction");
const EEurTransaction = require("./models/EEurTransaction");

const app = express();
const PORT = 5000;

// Connect to MongoDB
const MONGODB_URL =process.env.MONGODB_URL ;
mongoose.connect(MONGODB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Define a schema for the user balance
const balanceSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  balance: { type: Number, default: 1000 },
});

const Balance = mongoose.model("Balance", balanceSchema);

// Parse JSON bodies
app.use(express.json());
app.get("/get-balance/:userId", async (req, res) => {
  const userId = req.params.userId;

  setTimeout(async () => {
    try {
      // Find the user's balance
      const userBalance = await Balance.findOne({ userId });

      if (!userBalance) {
        return res.status(404).json({ error: "User balance not found" });
      }

      return res.json({ balance: userBalance.balance });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }, 20000); // 20-second delay
});

app.post("/convert-to-e-cad", async (req, res) => {
  const { userId, amount } = req.body;

  setTimeout(async () => {
    try {
      // Find the user's existing E-CAD transaction
      let eCadTransaction = await ECadTransaction.findOne({ userId });

      if (!eCadTransaction) {
        // If no existing transaction, create a new one
        eCadTransaction = new ECadTransaction({
          userId,
          amount,
        });
      } else {
        // If an existing transaction exists, update the amount
        eCadTransaction.amount += amount;
      }

      // Save the updated or new transaction
      await eCadTransaction.save();

      return res.json({ eCadAmount: eCadTransaction.amount });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }, 20000); // 20-second delay
});

app.get("/get-eCad/:userId", async (req, res) => {
  const userId = req.params.userId;

  setTimeout(async () => {
    try {
      // Find E-CAD transactions for the given user
      const eCadTransactions = await ECadTransaction.find({ userId });

      if (!eCadTransactions || eCadTransactions.length === 0) {
        return res
          .status(404)
          .json({ error: "No E-CAD transactions found for this user" });
      }

      return res.json(eCadTransactions);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }, 20000); // 20-second delay
});

app.post("/convert-eCad-to-other-cbdc ", async (req, res) => {
  const { userId, amount, currencyCode } = req.body;
  const conversionRates = {
    EUR: 0.5, // Conversion rate for EUR
    // Add more conversion rates as needed
  };

  setTimeout(async () => {
    try {
      // Find the user's E-CAD transaction
      const eCadTransaction = await ECadTransaction.findOne({ userId });

      if (!eCadTransaction) {
        return res
          .status(404)
          .json({ error: "E-CAD transaction not found for user" });
      }

      // Check if the provided currency code is valid
      if (!conversionRates.hasOwnProperty(currencyCode)) {
        return res.status(400).json({ error: "Invalid currency code" });
      }

      // Calculate the E-EUR amount based on conversion rate
      const conversionRate = conversionRates[currencyCode];
      const eEurAmount = amount * conversionRate;

      // Check if the user has sufficient E-CAD balance
      if (eCadTransaction.amount < amount) {
        return res.status(400).json({ error: "Insufficient E-CAD balance" });
      }

      // Deduct the E-CAD amount
      eCadTransaction.amount -= amount;
      await eCadTransaction.save();

      // Create or update the E-EUR transaction
      let eEurTransaction = await EEurTransaction.findOne({ userId });

      if (!eEurTransaction) {
        // If no existing transaction, create a new one
        eEurTransaction = new EEurTransaction({
          userId,
          amount: eEurAmount,
        });
      } else {
        // If an existing transaction exists, update the amount
        eEurTransaction.amount += eEurAmount;
      }

      // Save the updated or new E-EUR transaction
      await eEurTransaction.save();

      return res.json({ eEurAmount, newECadBalance: eCadTransaction.amount });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }, 20000); // 20-second delay
});

app.get("/get-other-cbdc-balance/:userId", async (req, res) => {
  const userId = req.params.userId;

  setTimeout(async () => {
    try {
      // Find the E-EUR transaction for the user
      const eEurTransaction = await EEurTransaction.findOne({ userId });

      if (!eEurTransaction) {
        return res
          .status(404)
          .json({ error: "E-EUR transaction not found for user" });
      }

      // Send the E-EUR balance in the response
      return res.json({ eEurBalance: eEurTransaction.amount });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }, 20000); // 20-second delay
});

app.post("/transfer-cbdc", async (req, res) => {
  const { senderId, receiverId, amount } = req.body;

  setTimeout(async () => {
    try {
      // Find the sender's E-EUR transaction
      const senderTransaction = await EEurTransaction.findOne({
        userId: senderId,
      });

      if (!senderTransaction) {
        return res
          .status(404)
          .json({ error: "Sender E-EUR transaction not found" });
      }

      // Check if the sender has sufficient E-EUR balance
      if (senderTransaction.amount < amount) {
        return res.status(400).json({ error: "Insufficient E-EUR balance" });
      }

      // Deduct the E-EUR amount from sender
      senderTransaction.amount -= amount;
      await senderTransaction.save();

      // Find the receiver's E-EUR transaction
      let receiverTransaction = await EEurTransaction.findOne({
        userId: receiverId,
      });

      if (!receiverTransaction) {
        // If no existing transaction, create a new one for receiver
        receiverTransaction = new EEurTransaction({
          userId: receiverId,
          amount,
        });
      } else {
        // If an existing transaction exists, add the amount to receiver's balance
        receiverTransaction.amount += amount;
      }

      // Save the updated or new receiver's E-EUR transaction
      await receiverTransaction.save();

      return res.json({ transferredAmount: amount, senderId, receiverId });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }, 20000); // 20-second delay
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
