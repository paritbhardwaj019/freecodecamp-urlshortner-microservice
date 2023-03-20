require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const validator = require("validator");
const shortID = require("shortid");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.urlencoded());
app.use(express.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

const dbConnect = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("Database Connected Successfully!"))
    .catch(() => console.log("Database Error Occured!"));
};

dbConnect();

const UrlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});
const Url = mongoose.model("Url", UrlSchema);

// Your first API endpoint
app.post("/api/shorturl", async function (req, res) {
  const url = req.body.url;
  const uniqueID = shortID.generate();
  const checkUrl = validator.isURL(url.trim());

  if (!checkUrl) {
    res.json({ error: "invalid url" });
  } else {
    try {
      const existingUrl = await Url.findOne({ original_url: url });
      if (existingUrl) {
        res.status(200).json(existingUrl);
      } else {
        const createUrl = await Url.create({
          original_url: url,
          short_url: uniqueID,
        });
        res.status(200).json(createUrl);
      }
    } catch {
      res.status(500).json({ error: "Unknown Server Error!" });
    }
  }
});

app.get("/api/shorturl/:id", async function (req, res) {
  const { id } = req.params;
  const findUrlById = await Url.findOne({ short_url: id });
  if (findUrlById) {
    res.redirect(301, findUrlById.original_url);
  } else {
    res.status(400).json({ error: "No Url Found With this ID." });
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
