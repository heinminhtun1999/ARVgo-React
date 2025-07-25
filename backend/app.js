// Server Module and Configuration
const express = require('express');
const env = require('dotenv').config();
const cors = require('cors');
const { imagesPath, videosPath } = require("./utils/configs.js");
const fs = require('fs');

// Ensure upload directories exist
if (!fs.existsSync(imagesPath)) {
    fs.mkdirSync(imagesPath, { recursive: true });
}
if (!fs.existsSync(videosPath)) {
    fs.mkdirSync(videosPath, { recursive: true });
}

// File Upload 
const multer = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fileType = file.mimetype.split('/')[0];
        if (fileType === 'image') {
            return cb(null, 'uploads/images/');
        } else if (fileType === 'video') {
            return cb(null, 'uploads/videos/');
        } else {
            return cb(new Error('Invalid file type'), 'uploads/others/');
        }
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
})
const uploads = multer({ storage: storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB limit



// DB
const sql = require("./db/db.js");
const initializeDB = require("./utils/initialize_db.js");

// Import Controllers
const { getAllPosts, getPost, createPost, editPost } = require("./controllers/postController.js");
const { getAllAlbums } = require("./controllers/albumController.js");

// Server Configuration and Initialization
const PORT = process.env.PORT;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    credentials: true,
}));
(async () => {
    await initializeDB(sql)
})()

// Routes
app.get("/", async (req, res) => {
    res.send("Hello World!");
});

// Posts
app.get("/api/posts", getAllPosts);
app.get("/api/posts/:post_id", getPost);
app.post("/api/post", uploads.fields([{ name: "image" }, { name: "video" }]), createPost);
app.patch("/api/posts/:post_id", uploads.fields([{ name: "image" }, { name: "video" }]), editPost);

// Albums
app.get("/api/albums", getAllAlbums);

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

