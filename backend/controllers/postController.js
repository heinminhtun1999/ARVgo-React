const sql = require('../db/db');

module.exports.createPost = async (req, res) => {

    let { title, content, media, eventDate } = req.body.data;
    console.log(media);
    title = title.trim();

    const data = {
        title,
        content,
        event_date: eventDate ? eventDate : new Date()
    }

    // Check if album exists
    const existingAlbum = await sql`SELECT * FROM albums WHERE name=${title}`

    // Create new album if it doesn't exist
    if (existingAlbum.length > 0) {
        data.album_id = existingAlbum[0].id;
    } else {
        const album = await sql`INSERT INTO albums (name) VALUES (${title}) RETURNING id`;
        data.album_id = album[0].id;
    }

    // Insert post into the database
    try {
        const post = await sql`INSERT INTO posts ${sql(data)} RETURNING *`;
        res.status(200).json({
            message: "Post created successfully",
            post: post[0]
        });
    } catch (error) {
        console.error("[INFO] Error creating post:", error);
        res.status(500).json({
            message: "Error creating post",
            error: error.message
        });
    }
};