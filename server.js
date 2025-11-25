// server.js
require("dotenv").config();
const connectDB = require("./src/config/db");
const app = require("./src/app");

connectDB();

const PORT = process.env.PORT

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
