const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.get("/", (req, res) => {
  res.send("API is running!");
});

app.get("/download", (req, res) => {
  const url = req.query.url;

  res.json({
    success: true,
    url: url || null
  });
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

