const { betterAuth } = require("better-auth");

const { mongodbAdapter } = require("@better-auth/mongo-adapter");
const { client } = require("../config/db");

const db = client.db("momentumxDB");

// const auth = betterAuth({
//   trustedOrigins: [process.env.CLIENT_URL],
//   database: mongodbAdapter(db, {
//     client,
//   }),
//   emailAndPassword: {
//     enabled: true,
//   },
// });
// console.log("CLIENT_URL:", process.env.CLIENT_URL);
// console.log("BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);


const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  trustedOrigins: [process.env.CLIENT_URL],

  database: mongodbAdapter(db, {
    client,
  }),

  emailAndPassword: {
    enabled: true,
  },

  advanced: {
    useSecureCookies: true,

    // cookies: {
    //   session_token: {
    //     attributes: {
    //       sameSite: "none",
    //       secure: true,
    //     },
    //   },
    // },
  },
});

// const auth = betterAuth({
//   trustedOrigins: [process.env.CLIENT_URL],

//   database: mongodbAdapter(db, {
//     client,
//   }),

//   emailAndPassword: {
//     enabled: true,
//   },

//   advanced: {
//     crossSubDomainCookies: {
//       enabled: true,
//     },
//   },

//   cookies: {
//     sessionToken: {
//       attributes: {
//         sameSite: "none",
//         secure: true,
//       },
//     },
//   },
// });

module.exports = { auth };
