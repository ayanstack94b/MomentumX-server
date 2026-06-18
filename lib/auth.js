const { betterAuth } = require("better-auth");

const { mongodbAdapter } = require("@better-auth/mongo-adapter");
const { client } = require("../config/db");

const db = client.db("momentumxDB");

const auth = betterAuth({
  trustedOrigins: ["http://localhost:3000"],
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
});

module.exports = { auth };
