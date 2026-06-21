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

/* -----------------------------MongoDB Collections------------------------ */

// MomentumX Database
const db = client.db("momentumxDB");

// Users Collection
const usersCollection = db.collection("users");
const classesCollection = client.db("momentumxDB").collection("classes");

// Booking collection
const bookingsCollection = client.db("momentumxDB").collection("bookings");
const trainerApplicationsCollection = db.collection("trainerApplications");

/* ----------------------------- Basic Routes------------------------------ */

app.get("/", (req, res) => {
  res.send("MomentumX Server is Running");
});
app.get("/bookings", async (req, res) => {
  const result = await bookingsCollection.find().toArray();

  res.send(result);
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

  const result = await usersCollection.findOne({
    email,
  });

  res.send(result);
});

// Creating classes
app.get("/classes", async (req, res) => {
  const query = {
    status: "approved",
  };

  const result = await classesCollection.find(query).toArray();

  res.send(result);
});

app.get("/classes/:id", async (req, res) => {
  const id = req.params.id;

  const query = {
    _id: new ObjectId(id),
  };

  const result = await classesCollection.findOne(query);

  res.send(result);
});

app.get("/classes/trainer/:email", async (req, res) => {
  const email = req.params.email;

  const query = {
    trainerEmail: email,
  };

  const result = await classesCollection.find(query).toArray();

  res.send(result);
});

app.get("/trainer-applications/:email", async (req, res) => {
  const email = req.params.email;

  const result = await trainerApplicationsCollection.findOne({
    email,
  });

  res.json(result || null);
});

// Get all trainers application
app.get("/trainer-applications", async (req, res) => {
  const result = await trainerApplicationsCollection.find().toArray();

  res.send(result);
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

app.post("/classes", async (req, res) => {
  const classData = req.body;

  const result = await classesCollection.insertOne(classData);

  res.send(result);
});

app.post("/bookings", async (req, res) => {
  const booking = req.body;

  const result = await bookingsCollection.insertOne(booking);

  res.send(result);
});

app.post("/trainer-applications", async (req, res) => {
  const application = req.body;

  const result = await trainerApplicationsCollection.insertOne(application);

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

app.patch("/classes/:id", async (req, res) => {
  const id = req.params.id;
  const updatedClass = req.body;

  delete updatedClass._id;

  const query = {
    _id: new ObjectId(id),
  };

  const updateDoc = {
    $set: updatedClass,
  };

  const result = await classesCollection.updateOne(query, updateDoc);

  res.send(result);
});

app.post("/trainer-applications", async (req, res) => {
  const application = req.body;

  const existingApplication = await trainerApplicationsCollection.findOne({
    email: application.email,
  });

  if (existingApplication && existingApplication.status !== "rejected") {
    return res.status(400).send({
      message: "Application already exists",
    });
  }

  const result = await trainerApplicationsCollection.insertOne(application);

  res.send(result);
});

// Trainer accept Reject route
app.patch("/trainer-applications/:id", async (req, res) => {
  const id = req.params.id;

  const { status } = req.body;

  const application = await trainerApplicationsCollection.findOne({
    _id: new ObjectId(id),
  });

  if (!application) {
    return res.status(404).send({
      message: "Application not found",
    });
  }

  await trainerApplicationsCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        status,
      },
    },
  );

  if (status === "approved") {
    await usersCollection.updateOne(
      {
        email: application.email,
      },
      {
        $set: {
          role: "trainer",
        },
      },
    );
  }

  res.send({
    success: true,
    message: "Application updated",
  });
});

// Delete route
app.delete("/classes/:id", async (req, res) => {
  const id = req.params.id;

  const query = {
    _id: new ObjectId(id),
  };

  const result = await classesCollection.deleteOne(query);

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
