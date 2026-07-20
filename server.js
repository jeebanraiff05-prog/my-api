const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

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

// Render ले दिने PORT प्रयोग गर्ने
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
