require("dotenv").config();
console.log("CLIENT_URL =", process.env.CLIENT_URL);
console.log("BETTER_AUTH_URL =", process.env.BETTER_AUTH_URL);

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
    origin: [
      "http://localhost:3000",
      "https://momentum-x-client.vercel.app",
      "https://momentum-x-client-git-main-ayanstack94bs-projects.vercel.app",
    ],
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
const forumsCollection = db.collection("forums");
const commentsCollection = db.collection("comments");

/* ----------------------------- Basic Routes------------------------------ */

app.get("/", (req, res) => {
  res.send("MomentumX Server is Running");
});
app.get("/bookings", async (req, res) => {
  const result = await bookingsCollection.find().toArray();

  res.send(result);
});

// =============================GET==================================

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

// Admin stasts route
app.get("/admin/stats", async (req, res) => {
  const totalUsers = await usersCollection.countDocuments();

  const totalTrainers = await usersCollection.countDocuments({
    role: "trainer",
  });

  const totalClasses = await classesCollection.countDocuments();

  const totalPosts = await forumsCollection.countDocuments();

  res.send({
    totalUsers,
    totalTrainers,
    totalClasses,
    totalPosts,
  });
});

// all classes
app.get("/classes", async (req, res) => {
  const search = req.query.search || "";

  const category = req.query.category || "";

  const page = parseInt(req.query.page) || 1;

  const limit = parseInt(req.query.limit) || 6;

  const skip = (page - 1) * limit;

  const query = {
    status: "approved",
  };

  if (search) {
    query.className = {
      $regex: search,
      $options: "i",
    };
  }

  if (category) {
    query.category = category;
  }

  const total = await classesCollection.countDocuments(query);

  const classes = await classesCollection
    .find(query)
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .toArray();

  res.send({
    total,
    classes,
  });
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
// All trainer routes
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

// Payment route
app.get("/bookings/check", async (req, res) => {
  const { email, classId } = req.query;

  console.log("EMAIL:", email);
  console.log("CLASSID:", classId);

  const existingBooking = await bookingsCollection.findOne({
    memberEmail: email,
    classId: classId,
  });

  console.log("BOOKING:", existingBooking);

  res.send({
    booked: !!existingBooking,
  });
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

app.get("/bookings/class/:classId", async (req, res) => {
  const classId = req.params.classId;

  const result = await bookingsCollection
    .find({ classId })
    .project({
      memberName: 1,
      memberEmail: 1,
      _id: 0,
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

// Forums
app.get("/forums", async (req, res) => {
  const page = parseInt(req.query.page) || 1;

  const limit = parseInt(req.query.limit) || 6;

  const skip = (page - 1) * limit;

  const total = await forumsCollection.countDocuments();

  const forums = await forumsCollection
    .find()
    .sort({
      createdAt: -1,
    })
    .skip(skip)
    .limit(limit)
    .toArray();

  res.send({
    total,
    forums,
  });
});
// Single forum
app.get("/forums/:id", async (req, res) => {
  const id = req.params.id;

  const result = await forumsCollection.findOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

// Get Forum
app.get("/forums/user/:email", async (req, res) => {
  const email = req.params.email;

  const result = await forumsCollection
    .find({
      authorEmail: email,
    })
    .sort({
      createdAt: -1,
    })
    .toArray();

  res.send(result);
});

// Comments By Forum ID
app.get("/comments/:forumId", async (req, res) => {
  const forumId = req.params.forumId;

  const result = await commentsCollection
    .find({
      forumId,
    })
    .sort({
      createdAt: -1,
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

  const user = await usersCollection.findOne({
    email: booking.memberEmail,
  });

  console.log("BOOKING EMAIL:", booking.memberEmail);

  console.log("FOUND USER:", user);

  if (user?.status === "blocked") {
    return res.status(403).send({
      message: "Blocked users cannot book classes",
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
  const user = await usersCollection.findOne({
    email: application.email,
  });

  if (user?.status === "blocked") {
    return res.status(403).send({
      message: "Blocked users cannot apply as trainers",
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

app.post("/forums", async (req, res) => {
  const forum = req.body;

  const user = await usersCollection.findOne({
    email: forum.authorEmail,
  });

  if (user?.status === "blocked") {
    return res.status(403).send({
      message: "Blocked users cannot create forum posts",
    });
  }

  const result = await forumsCollection.insertOne(forum);

  res.send(result);
});

// Comments route
app.post("/comments", async (req, res) => {
  const comment = req.body;

  const result = await commentsCollection.insertOne(comment);

  res.send(result);
});
// ================================PATCH==============================================

// Admin route
app.patch("/users/admin/:id", async (req, res) => {
  const result = await usersCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
    },
    {
      $set: {
        role: "admin",
      },
    },
  );

  res.send(result);
});

// remove admin
app.patch("/users/remove-admin/:id", async (req, res) => {
  const result = await usersCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
    },
    {
      $set: {
        role: "member",
      },
    },
  );

  res.send(result);
});

// Block an user
app.patch("/users/block/:id", async (req, res) => {
  const result = await usersCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
    },
    {
      $set: {
        status: "blocked",
      },
    },
  );

  res.send(result);
});

// unblock an user
app.patch("/users/unblock/:id", async (req, res) => {
  const result = await usersCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
    },
    {
      $set: {
        status: "active",
      },
    },
  );

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

// Likes and dislike
app.patch("/forums/react/:id", async (req, res) => {
  const { email, type } = req.body;

  const forum = await forumsCollection.findOne({
    _id: new ObjectId(req.params.id),
  });

  if (!forum) {
    return res.status(404).send({
      message: "Forum not found",
    });
  }

  const likedBy = forum.likedBy || [];

  const dislikedBy = forum.dislikedBy || [];

  if (type === "like") {
    if (likedBy.includes(email)) {
      return res.status(400).send({
        message: "Already liked",
      });
    }

    const wasDisliked = dislikedBy.includes(email);

    await forumsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $inc: {
          likes: 1,
          dislikes: wasDisliked ? -1 : 0,
        },

        $push: {
          likedBy: email,
        },

        $pull: {
          dislikedBy: email,
        },
      },
    );
  }

  if (type === "dislike") {
    if (dislikedBy.includes(email)) {
      return res.status(400).send({
        message: "Already disliked",
      });
    }

    const wasLiked = likedBy.includes(email);

    await forumsCollection.updateOne(
      {
        _id: new ObjectId(req.params.id),
      },
      {
        $inc: {
          dislikes: 1,
          likes: wasLiked ? -1 : 0,
        },

        $push: {
          dislikedBy: email,
        },

        $pull: {
          likedBy: email,
        },
      },
    );
  }

  res.send({
    success: true,
  });
});

// edit a comment
app.patch("/comments/:id", async (req, res) => {
  const { comment } = req.body;

  const result = await commentsCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
    },
    {
      $set: {
        comment,
      },
    },
  );

  res.send(result);
});

//Add reply to comments
app.patch("/comments/reply/:id", async (req, res) => {
  const reply = req.body;

  const result = await commentsCollection.updateOne(
    {
      _id: new ObjectId(req.params.id),
    },
    {
      $push: {
        replies: reply,
      },
    },
  );

  res.send(result);
});

// Delete replies
app.patch("/comments/reply/delete/:commentId", async (req, res) => {
  const { replyId } = req.body;

  const result = await commentsCollection.updateOne(
    {
      _id: new ObjectId(req.params.commentId),
    },
    {
      $pull: {
        replies: {
          _id: replyId,
        },
      },
    },
  );

  res.send(result);
});

// edit comment
app.patch("/comments/reply/edit/:commentId", async (req, res) => {
  const { replyId, reply } = req.body;

  const comment = await commentsCollection.findOne({
    _id: new ObjectId(req.params.commentId),
  });

  if (!comment) {
    return res.status(404).send({
      message: "Comment not found",
    });
  }

  const updatedReplies = (comment.replies || []).map((item) =>
    item._id === replyId
      ? {
          ...item,
          reply,
        }
      : item,
  );

  const result = await commentsCollection.updateOne(
    {
      _id: new ObjectId(req.params.commentId),
    },
    {
      $set: {
        replies: updatedReplies,
      },
    },
  );

  res.send(result);
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
// Delete post from forum
app.delete("/forums/:id", async (req, res) => {
  const id = req.params.id;

  const result = await forumsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

// Deleting a comment
app.delete("/comments/:id", async (req, res) => {
  const result = await commentsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});

// Delete classes rejected data
app.delete("/classes/:id", async (req, res) => {
  const result = await classesCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});

// Trainer application delete
app.delete("/trainer-applications/:id", async (req, res) => {
  const result = await trainerApplicationsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});
// ==================================AUTH===========================================
//  Better Auth Routes
// app.use("/api/auth", toNodeHandler(auth));
app.use("/api/auth", (req, res, next) => {
  console.log("================================");
  console.log("PATH:", req.path);
  console.log("COOKIE HEADER:", req.headers.cookie);
  console.log("================================");

  return toNodeHandler(auth)(req, res, next);
});

// ================================Database==========================================
//  Database Connection
connectDB();

//  Start Server
app.listen(port, () => {
  console.log(`MomentumX running on port ${port}`);
});
