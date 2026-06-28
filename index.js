require("dotenv").config();

const jwt = require("jsonwebtoken");

const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({
      message: "Unauthorized Access",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized Access",
      });
    }

    req.decoded = decoded;
    next();
  });
};

const verifyAdmin = async (req, res, next) => {
  try {
    const user = await usersCollection.findOne({
      email: {
        $regex: `^${req.decoded.email}$`,
        $options: "i",
      },
    });

    if (!user || user.role !== "admin") {
      return res.status(403).send({
        message: "Forbidden Access",
      });
    }

    next();
  } catch (error) {
    res.status(500).send({
      message: "Server Error",
    });
  }
};

const { ObjectId } = require("mongodb");
const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

app.use((req, res, next) => {
  if (req.url.includes("/api/auth")) {
    console.log("AUTH ROUTE:", req.method, req.url);
  }
  next();
});

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
app.get("/bookings", verifyJWT, async (req, res) => {
  const result = await bookingsCollection.find().toArray();

  res.send(result);
});

// =============================GET==================================

// Get All Users
app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
  const users = await usersCollection.find().toArray();
  res.send(users);
});

// All trainer routes
app.get("/users/trainers", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const trainers = await usersCollection
      .find({
        role: "trainer",
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    res.send(trainers);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch trainers.",
    });
  }
});

// Get Single User By Email
app.get("/users/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    return res.status(403).send({
      message: "Forbidden Access",
    });
  }
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
app.get("/admin/classes", verifyJWT, verifyAdmin, async (req, res) => {
  const result = await classesCollection.find().toArray();

  res.send(result);
});

// Admin stats route
app.get("/admin/stats", verifyJWT, verifyAdmin, async (req, res) => {
  const totalUsers = await usersCollection.countDocuments();

  const totalTrainers = await usersCollection.countDocuments({
    role: "trainer",
  });

  const totalClasses = await classesCollection.countDocuments();

  const totalBookedClasses = await bookingsCollection.countDocuments();

  res.send({
    totalUsers,
    totalTrainers,
    totalClasses,
    totalBookedClasses,
  });
});

app.get("/transactions", verifyJWT, verifyAdmin, async (req, res) => {
  try {
    const result = await bookingsCollection
      .find({
        paymentStatus: "paid",
      })
      .sort({
        paidAt: -1,
      })
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to fetch transactions.",
    });
  }
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

app.get("/classes/update/:id", verifyJWT, async (req, res) => {
  const { id } = req.params;

  const result = await classesCollection.findOne({
    _id: new ObjectId(id),
    trainerEmail: req.decoded.email,
  });

  res.send(result);
});

app.get("/trainer-applications/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;

  const result = await trainerApplicationsCollection.findOne({
    email,
  });

  res.json(result || null);
});
// Get all trainers application
app.get("/trainer-applications", verifyJWT, async (req, res) => {
  const result = await trainerApplicationsCollection.find().toArray();

  res.send(result);
});

// Payment route
app.get("/bookings/check", verifyJWT, async (req, res) => {
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

app.get("/bookings/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;

  const result = await bookingsCollection
    .find({
      memberEmail: email,
    })
    .toArray();

  res.send(result);
});

app.get("/bookings/member/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;

  const result = await bookingsCollection
    .find({
      memberEmail: email,
    })
    .toArray();

  res.send(result);
});

app.get("/bookings/class/:classId", verifyJWT, async (req, res) => {
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

app.get("/favorites/check", verifyJWT, async (req, res) => {
  const { email, classId } = req.query;

  if (email !== req.decoded.email) {
    return res.status(403).send({
      message: "Forbidden Access",
    });
  }

  const favorite = await favoritesCollection.findOne({
    userEmail: email,
    classId,
  });

  res.send({
    favorite: !!favorite,
  });
});

// Users favorites
app.get("/favorites/:email", verifyJWT, async (req, res) => {
  const email = req.params.email;

  if (email !== req.decoded.email) {
    return res.status(403).send({
      message: "Forbidden Access",
    });
  }

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
app.get("/forums/user/:email", verifyJWT, async (req, res) => {
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

app.post("/google-login", async (req, res) => {
  const { name, email, image } = req.body;

  let user = await usersCollection.findOne({
    email: {
      $regex: `^${email}$`,
      $options: "i",
    },
  });

  if (!user) {
    const newUser = {
      name,
      email: email.toLowerCase(),
      image: image || "",

      role: "member",
      status: "active",

      membership: "basic",

      trainerApplicationStatus: null,
      trainerFeedback: "",

      bio: "",
      phone: "",
      location: "",

      createdAt: new Date().toISOString(),
    };

    await usersCollection.insertOne(newUser);

    user = newUser;
  }

  const token = jwt.sign(
    {
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  res.send({
    token,
    user,
  });
});

// Jwt route
app.post("/jwt", async (req, res) => {
  const { email } = req.body;

  const user = await usersCollection.findOne({ email });

  if (!user) {
    return res.status(401).send({
      message: "User not found",
    });
  }

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.send({ token });
});

app.post("/classes", verifyJWT, async (req, res) => {
  const classData = req.body;

  const result = await classesCollection.insertOne(classData);

  res.send(result);
});

app.post("/bookings", verifyJWT, async (req, res) => {
  const booking = req.body;

  if (!booking.memberEmail) {
    return res.status(401).send({
      message: "Login required",
    });
  }

  const user = await usersCollection.findOne({
    email: booking.memberEmail,
  });

  if (!user) {
    return res.status(404).send({
      message: "User not found",
    });
  }

  if (user.role === "trainer") {
    return res.status(403).send({
      message: "Trainers cannot book classes.",
    });
  }

  if (user.role === "admin") {
    return res.status(403).send({
      message: "Admins cannot book classes.",
    });
  }

  if (user.status === "blocked") {
    return res.status(403).send({
      message: "Blocked users cannot book classes.",
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

app.post("/create-checkout-session", verifyJWT, async (req, res) => {
  console.log(req.body);
  try {
    const {
      classId,
      className,
      trainerName,
      trainerEmail,
      price,
      memberName,
      memberEmail,
      schedule,
      duration,
      category,
      image,
    } = req.body;
    // Blocked user check
    const dbUser = await usersCollection.findOne({
      email: req.decoded.email,
    });

    if (dbUser?.status === "blocked") {
      return res.status(403).send({
        message: "Action restricted by Admin.",
      });
    }
    // Duplicate booking check
    const alreadyBooked = await bookingsCollection.findOne({
      classId,
      memberEmail,
    });

    if (alreadyBooked) {
      return res.status(409).send({
        message: "You have already booked this class.",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],

      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "inr",

            product_data: {
              name: className,

              description: `Trainer: ${trainerName}`,
            },

            unit_amount: Number(price) * 100,
          },

          quantity: 1,
        },
      ],

      metadata: {
        classId,
        className,
        trainerName,
        trainerEmail,
        memberName,
        memberEmail,
        schedule,
        duration,
        category,
        image,
        price: String(price),
      },

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.CLIENT_URL}/payment/${classId}`,
    });

    res.send({
      url: session.url,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      message: "Failed to create checkout session.",
    });
  }
});

app.post("/confirm-payment", verifyJWT, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log(session.metadata);
    if (session.payment_status !== "paid") {
      return res.status(400).send({
        success: false,
        message: "Payment not completed.",
      });
    }

    const booking = {
      classId: session.metadata.classId,
      className: session.metadata.className,
      trainerName: session.metadata.trainerName,
      trainerEmail: session.metadata.trainerEmail,

      memberName: session.metadata.memberName,
      memberEmail: session.metadata.memberEmail,

      schedule: session.metadata.schedule,
      duration: session.metadata.duration,
      category: session.metadata.category,
      image: session.metadata.image,

      price: Number(session.metadata.price),

      paymentStatus: "paid",

      transactionId: session.payment_intent,

      stripeSessionId: session.id,

      bookedAt: new Date().toISOString(),

      paidAt: new Date().toISOString(),
    };

    const exists = await bookingsCollection.findOne({
      stripeSessionId: session.id,
    });

    if (!exists) {
      await bookingsCollection.insertOne(booking);
    }

    res.send({
      success: true,
    });
  } catch (error) {
    console.error(error);

    res.status(500).send({
      success: false,
      message: "Failed to verify payment.",
    });
  }
});

app.post("/trainer-applications", verifyJWT, async (req, res) => {
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

app.post("/favorites", verifyJWT, async (req, res) => {
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

app.post("/forums", verifyJWT, async (req, res) => {
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
app.post("/comments", verifyJWT, async (req, res) => {
  const comment = req.body;

  const user = await usersCollection.findOne({
    email: req.decoded.email,
  });

  if (user?.status === "blocked") {
    return res.status(403).send({
      message: "Action restricted by Admin.",
    });
  }

  const result = await commentsCollection.insertOne(comment);

  res.send(result);
});
// ================================PATCH==============================================

// Admin route
app.patch("/users/admin/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const id = req.params.id;

  const before = await usersCollection.findOne({
    _id: new ObjectId(id),
  });

  console.log("BEFORE:", before);

  const result = await usersCollection.updateOne(
    {
      _id: new ObjectId(id),
    },
    {
      $set: {
        role: "admin",
      },
    },
  );

  const after = await usersCollection.findOne({
    _id: new ObjectId(id),
  });

  console.log("RESULT:", result);
  console.log("AFTER:", after);

  res.send(result);
});

// remove admin
app.patch(
  "/users/remove-admin/:id",
  verifyJWT,
  verifyAdmin,
  async (req, res) => {
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
  },
);

// Block an user
app.patch("/users/block/:id", verifyJWT, verifyAdmin, async (req, res) => {
  // Find the user that is about to be blocked
  const targetUser = await usersCollection.findOne({
    _id: new ObjectId(req.params.id),
  });

  // Prevent admin from blocking themselves
  if (targetUser.email === req.decoded.email) {
    return res.status(400).send({
      message: "You cannot block your own account.",
    });
  }

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
app.patch("/users/unblock/:id", verifyJWT, verifyAdmin, async (req, res) => {
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
app.patch("/users/:id", verifyJWT, async (req, res) => {
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

app.patch("/classes/:id", verifyJWT, verifyAdmin, async (req, res) => {
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

app.patch("/classes/update/:id", verifyJWT, async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body };
    delete updatedData._id;

    const result = await classesCollection.updateOne(
      {
        _id: new ObjectId(id),
        trainerEmail: req.decoded.email,
      },
      {
        $set: updatedData,
      },
    );

    res.send(result);
  } catch (error) {
    console.log(error);
    res.status(500).send(error.message);
  }
});

// Trainer accept Reject route
app.patch(
  "/trainer-applications/:id",
  verifyJWT,
  verifyAdmin,
  async (req, res) => {
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
  },
);

app.patch(
  "/users/remove-trainer/:id",
  verifyJWT,
  verifyAdmin,
  async (req, res) => {
    const trainer = await usersCollection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!trainer) {
      return res.status(404).send({
        message: "Trainer not found.",
      });
    }

    if (trainer.role !== "trainer") {
      return res.status(400).send({
        message: "User is not a trainer.",
      });
    }

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
    await trainerApplicationsCollection.updateOne(
      {
        email: trainer.email,
      },
      {
        $set: {
          status: "demoted",
        },
      },
    );
    res.send(result);
  },
);

// Likes and dislike
app.patch("/forums/react/:id", verifyJWT, async (req, res) => {
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
      return res.send({
        success: false,
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
      return res.send({
        success: false,
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
app.patch("/comments/:id", verifyJWT, async (req, res) => {
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
app.patch("/comments/reply/:id", verifyJWT, async (req, res) => {
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
app.patch("/comments/reply/delete/:commentId", verifyJWT, async (req, res) => {
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
app.patch("/comments/reply/edit/:commentId", verifyJWT, async (req, res) => {
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
app.delete("/classes/:id", verifyJWT, async (req, res) => {
  console.log("JWT:", req.decoded.email);

  const classData = await classesCollection.findOne({
    _id: new ObjectId(req.params.id),
  });

  console.log("CLASS:", classData);

  const result = await classesCollection.deleteOne({
    _id: new ObjectId(req.params.id),
    trainerEmail: req.decoded.email,
  });

  console.log(result);

  res.send(result);
});

app.delete("/admin/classes/:id", verifyJWT, verifyAdmin, async (req, res) => {
  const result = await classesCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});

// users favorite
app.delete("/favorites/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;

  const result = await favoritesCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});
// Delete post from forum
app.delete("/forums/:id", verifyJWT, async (req, res) => {
  const id = req.params.id;

  const result = await forumsCollection.deleteOne({
    _id: new ObjectId(id),
  });

  res.send(result);
});

// Deleting a comment
app.delete("/comments/:id", verifyJWT, async (req, res) => {
  const result = await commentsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
  });

  res.send(result);
});

// Trainer application delete
app.delete("/trainer-applications/:id", verifyJWT, async (req, res) => {
  console.log(req.decoded);
  const result = await trainerApplicationsCollection.deleteOne({
    _id: new ObjectId(req.params.id),
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
