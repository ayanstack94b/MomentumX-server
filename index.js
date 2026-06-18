const express = require("express");
require("dotenv").config();
const cors = require("cors");
const { client, connectDB } = require("./config/db");

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

connectDB();


// Routes
app.get("/", (req, res) => {
  res.send("MomentumX Server Running");
});



connectDB();
// Server
app.listen(port, () => {
  console.log(`MomentumX running on port ${port}`);
});
