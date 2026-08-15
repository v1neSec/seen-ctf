// Load environment variables from .env
require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 3000,
  ENV: process.env.NODE_ENV || "development",
  APP_NAME: "Acme Shop Enterprise",
};
