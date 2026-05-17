require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const API_KEY = process.env.API_KEY;
const BASE_URL = "https://ai.elliottwen.info";

app.post("/generate-image", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const authResponse = await fetch(`${BASE_URL}/auth`, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
      },
    });

    if (!authResponse.ok) {
      return res.status(401).json({ error: "Authentication failed" });
    }

    const authData = await authResponse.json();

    const generateResponse = await fetch(`${BASE_URL}/generate_image`, {
      method: "POST",
      headers: {
        Authorization: API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        signature: authData.signature,
        prompt,
      }),
    });

    if (!generateResponse.ok) {
      return res.status(500).json({ error: "Image generation failed" });
    }

    let imagePath = await generateResponse.text();
    imagePath = imagePath.replace(/"/g, "").trim();

    res.json({
      imageUrl: `${BASE_URL}/${imagePath}`,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
