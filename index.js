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


//  Middleware
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
const favoritesCollection = db.collection("favorites");

/* ----------------------------- Basic Routes------------------------------ */

app.get("/", (req, res) => {
  res.send("MomentumX Server is Running");
});
app.get("/bookings", async (req, res) => {
  const result = await bookingsCollection.find().toArray();

  res.send(result);
});

// =============================GET===================================
//  User Routes

// Get All Users
app.get("/users", async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.send(users);
});

// Get Single User By Email
app.get("/users/:email", async (req, res) => {
  const email = req.params.email;

  const result = await usersCollection.findOne({
    email: {
      $regex: `^${email}$`,
      $options: "i",
    },
  });

  if (!result) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.send(result);
});

// Creating classes
app.get("/admin/classes", async (req, res) => {
  const result = await classesCollection.find().toArray();

  res.send(result);
});
app.get("/classes", async (req, res) => {
  const result = await classesCollection
    .find({
      status: "approved",
    })
    .toArray();

  res.send(result);
});

app.get("/classes/trainer/:email", async (req, res) => {
  const email = req.params.email;

  const result = await classesCollection
    .find({
      trainerEmail: email,
    })
    .toArray();

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

app.get("/bookings/:email", async (req, res) => {
  const email = req.params.email;

  const result = await bookingsCollection
    .find({
      memberEmail: email,
    })
    .toArray();

  res.send(result);
});

app.get("/bookings/member/:email", async (req, res) => {
  const email = req.params.email;

  const result = await bookingsCollection
    .find({
      memberEmail: email,
    })
    .toArray();

  res.send(result);
});
// Users favorites
app.get("/favorites/:email", async (req, res) => {
  const email = req.params.email;

  const result = await favoritesCollection
    .find({
      userEmail: email,
    })
    .toArray();

  res.send(result);
});

// ==================================POST=========================================

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

  if (!booking.memberEmail) {
    return res.status(401).send({
      message: "Login required",
    });
  }

  const existingBooking = await bookingsCollection.findOne({
    classId: booking.classId,
    memberEmail: booking.memberEmail,
  });

  if (existingBooking) {
    return res.status(400).send({
      message: "You already booked this class",
    });
  }

  const result = await bookingsCollection.insertOne(booking);

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
  const { id } = req.params;

  const { status } = req.body;

  const result = await classesCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        status,
      },
    },
  );

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

app.post("/favorites", async (req, res) => {
  const favorite = req.body;

  const existingFavorite = await favoritesCollection.findOne({
    classId: favorite.classId,
    userEmail: favorite.userEmail,
  });

  if (existingFavorite) {
    return res.status(400).send({
      message: "Already in favorites",
    });
  }

  const result = await favoritesCollection.insertOne(favorite);

  res.send(result);
});

// ================================PATCH==============================================

// Trainer accept Reject route
app.patch("/trainer-applications/:id", async (req, res) => {
  const id = req.params.id;
  
  const { status, feedback } = req.body;
  
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
        feedback: feedback || "",
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

// ================================DELETE=============================================

// Delete route
app.delete("/classes/:id", async (req, res) => {
  const id = req.params.id;
  
  const query = {
    _id: new ObjectId(id),
  };

  const result = await classesCollection.deleteOne(query);

  res.send(result);
});
// users favorite
app.delete("/favorites/:id", async (req, res) => {
  const id = req.params.id;

  const result = await favoritesCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});
// ==================================AUTH===========================================
  //  Better Auth Routes
app.use("/api/auth", toNodeHandler(auth));

// ================================Database==========================================
//  Database Connection
connectDB();

//  Start Server
app.listen(port, () => {
  console.log(`MomentumX running on port ${port}`);
});
