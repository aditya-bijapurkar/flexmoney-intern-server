const express = require("express");
const cors = require("cors");
require("dotenv").config();
const schedule = require("node-schedule");

app = express();
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

const mongoose = require("mongoose");
mongoose.set("strictQuery", false);
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@cluster0.ydjkbkb.mongodb.net/?retryWrites=true&w=majority`
    );
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const Member = require("./models/memberModel");

app.get("/", (req, res) => {
  res.send({ hello: "world" });
});

app.post("/register", async (req, res) => {
  const data = req.body;
  const checkUser = await Member.findOne({ email: data.email });
  if (checkUser != null) {
    res.send({ error: "Email already exists" });
  } else {
    const newMember = new Member(data);
    await newMember.save();

    res.send({ record: "added" });
  }
});

app.post("/signin", async (req, res) => {
  const user = await Member.findOne({ email: req.body.email });
  if (user == null) {
    res.send({ error: "Email does not exists!" });
  } else if (user.password != req.body.password) {
    res.send({ error: "Password is invalid!" });
  } else res.send({ user });
});

app.post("/update", async (req, res) => {
  const user = await Member.findOne({ email: req.body.email });
  if (user.batch == req.body.newBatch) {
    res.send({ same: "batch" });
  } else {
    const updated = await Member.findOneAndUpdate(
      { email: req.body.email },
      { nextBatch: req.body.newBatch }
    );
    res.send({ success: "batch updated" });
  }
});

// updates batches for all the members on the 1st of every month
const updateBatches = schedule.scheduleJob("0 0 0 1 */1 *", async () => {
  await Member.updateMany({ nextBatch: { $ne: null } }, [
    { $set: { batch: { $concat: ["$nextBatch"] }, nextBatch: null } },
  ]);
  await Member.updateMany({ email: { $ne: null } }, { date: new Date() });
});

const PORT = process.env.port || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
});
