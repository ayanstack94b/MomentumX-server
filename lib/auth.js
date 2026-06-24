const { betterAuth } = require("better-auth");

const { mongodbAdapter } = require("@better-auth/mongo-adapter");
const { client } = require("../config/db");

const db = client.db("momentumxDB");

const auth = betterAuth({
  trustedOrigins: [process.env.CLIENT_URL],
  database: mongodbAdapter(db, {
    client,
  }),
  emailAndPassword: {
    enabled: true,
  },
});

module.exports = { auth };
