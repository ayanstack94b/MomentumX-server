require("dotenv").config();
const { ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const { toNodeHandler } = require("better-auth/node");

// MongoDB Connection
const { client, connectDB } = require("./config/db");

// Better Auth Config
const { auth } = require("./lib/auth");

const app = express();
const port = process.env.PORT || 5000;

/* -----------------------------
   Middleware
------------------------------ */
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

/* -----------------------------
   MongoDB Collections
------------------------------ */

// MomentumX Database
const db = client.db("momentumxDB");

// Users Collection
const usersCollection = db.collection("users");

/* -----------------------------
   Basic Routes
------------------------------ */

app.get("/", (req, res) => {
  res.send("MomentumX Server is Running");
});

/* -----------------------------
   User Routes
------------------------------ */

// Get All Users
app.get("/users", async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.send(users);
});

// Get Single User By Email
app.get("/users/:email", async (req, res) => {
  const email = req.params.email;

  const user = await usersCollection.findOne({
    email,
  });

  res.send(user);
});

// Create User
app.post("/users", async (req, res) => {
  const user = req.body;

  const existingUser = await usersCollection.findOne({
    email: user.email,
  });

  if (existingUser) {
    return res.send({
      message: "User already exists",
    });
  }

  const result = await usersCollection.insertOne(user);

  res.send(result);
});


// updating data 
app.patch("/users/:id", async (req, res) => {
  const id = req.params.id;
  const updatedData = req.body;

  const query = {
    _id: new ObjectId(id),
  };

  const updateDoc = {
    $set: updatedData,
  };

  const result = await usersCollection.updateOne(query, updateDoc);

  res.send(result);
});

/* -----------------------------
   Better Auth Routes
------------------------------ */

app.use("/api/auth", toNodeHandler(auth));

/* -----------------------------
   Database Connection
------------------------------ */

connectDB();

/* -----------------------------
   Start Server
------------------------------ */

app.listen(port, () => {
  console.log(`MomentumX running on port ${port}`);
});
