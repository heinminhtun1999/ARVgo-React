// Server Module
const express = require('express');
const env = require('dotenv').config();
const cors = require('cors');

// DB
const sql = require("./db/db.js");
const initializeDB = require("./utils/initialize_db.js");

// Import Controllers
const { createPost } = require("./controllers/postController.js");

// Server Configuration and Initialization
const PORT = process.env.PORT || 5001;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/media", express.static("uploads"));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
}));
(async () => {
    await initializeDB(sql)
})()

// Routes
app.get("/", async (req, res) => {
    res.send("Hello World!");
});

app.post("/api/posts", createPost)

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

