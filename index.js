require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { toNodeHandler } = require("better-auth/node");
const { connectDB } = require("./config/db");
const { auth } = require("./lib/auth");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.send("MomentumX Server Running");
});
app.use("/api/auth", toNodeHandler(auth));
// app.all("/api/auth/:path(*)", toNodeHandler(auth));

connectDB();
// Server
app.listen(port, () => {
  console.log(`MomentumX running on port ${port}`);
});
