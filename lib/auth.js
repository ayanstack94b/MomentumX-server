const { betterAuth } = require("better-auth");

const { mongodbAdapter } = require("@better-auth/mongo-adapter");
const { client } = require("../config/db");

const db = client.db("momentumxDB");

const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [
    process.env.CLIENT_URL,
    "https://momentum-x-client.vercel.app",
  ],

  database: mongodbAdapter(db, {
    client,
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },

  advanced: {
    useSecureCookies: false,
  },
});

module.exports = { auth };
