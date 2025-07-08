const sql = require('../db/db');
const { removeFiles } = require("../utils/utils.js");

// Get All posts 
module.exports.getAllPosts = async (req, res) => {

    const { orderBy, limit, offset, searchKeyword, eventDate, startDate, endDate } = req.query;

    const { field, order } = JSON.parse(orderBy);

    const allowedFields = {
        title: 'posts.title',
        album_name: 'albums.name',
        event_date: 'posts.event_date',
        uploaded_date: 'posts.created_at'
    }
    const allowedOrders = ["ASC", "DESC"];

    const sortingField = allowedFields[field] || 'posts.created_at';
    const sortingOrders = allowedOrders.includes(order) ? order : "DESC";

    try {

        let baseQuery = `
        SELECT posts.id AS id,
                posts.title AS title,
                albums.name AS album_name,
                to_char(posts.event_date, 'MM/DD/YYYY') as event_date,
                to_char(posts.created_at, 'MM/DD/YYYY') as uploaded_date
            FROM posts
            LEFT JOIN images ON posts.id = images.post_id
            LEFT JOIN videos ON posts.id = videos.post_id
            LEFT JOIN albums ON posts.album_id = albums.id
            WHERE (
                posts.title ILIKE $1 OR 
                albums.name ILIKE $1
            )
        `;
        const params = [`%${searchKeyword}%`];
        let paramIndex = 2;

        if (eventDate) {
            baseQuery += ` AND to_char(posts.event_date, 'YYYY-MM-DD') = $${paramIndex}`;
            params.push(eventDate);
            paramIndex++;
        }
        if (startDate) {
            baseQuery += ` AND to_char(posts.created_at, 'YYYY-MM-DD') >= $${paramIndex}`;
            params.push(startDate);
            paramIndex++;
        }
        if (endDate) {
            baseQuery += ` AND to_char(posts.created_at, 'YYYY-MM-DD') <= $${paramIndex}`;
            params.push(endDate);
            paramIndex++;
        }

        // For length
        const lengthQuery = baseQuery + ` GROUP BY posts.id, albums.name`;
        const fetchedLength = await sql.unsafe(lengthQuery, params);

        // For posts
        const postsQuery = lengthQuery + ` ORDER BY ${sortingField} ${sortingOrders} LIMIT ${limit} OFFSET ${offset}`;
        const posts = await sql.unsafe(postsQuery, params);
        console.error(posts)
        res.status(200).json({
            message: "Posts fetched successfully",
            data: {
                posts,
                fetchedLength: fetchedLength.length
            }
        });

    } catch (error) {
        console.error("[INFO] Error fetching posts:", error);
        res.status(500).json({ message: "An error occurred while fetching posts." });
    }
}


// Get Post
module.exports.getPost = async (req, res) => {
    const { post_id } = req.params;

    try {
        const query = sql`SELECT 
                                posts.id as id,
                                posts.title as title,
                                to_char(posts.event_date, 'YYYY-MM-DD') as event_date,
                                ARRAY_AGG(DISTINCT images.id) AS image_id,
                                ARRAY_AGG(DISTINCT images.url) AS images,
                                ARRAY_AGG(DISTINCT videos.id) AS video_id,
                                ARRAY_AGG(DISTINCT videos.url) AS videos,
                                albums.name as album,
                                albums.id as album_id,
                                posts.content as content
                            FROM posts
                            LEFT JOIN images ON posts.id = images.post_id
                            LEFT JOIN videos ON posts.id = videos.post_id
                            LEFT JOIN albums ON posts.album_id = albums.id
                            WHERE posts.id = ${post_id}
                            GROUP BY posts.id, albums.name, albums.id;`;

        const post = await query;
        console.log(post)
        res.status(200).json({
            message: "Post fetched successfully",
            data: post
        })

    } catch (error) {
        console.error("[INFO] Error fetching post:", error);
        res.status(500).json({ message: "An error occurred while fetching post." });
    }
}


// Create Post
module.exports.createPost = async (req, res) => {

    let { title, content, eventDate, album } = req.body;
    title = title.trim();

    const data = {
        title,
        content,
        event_date: eventDate ? eventDate : new Date()
    }

    // Check if album exists
    let newAlbum;

    if (album) {
        data.album_id = album
    } else {

        newAlbum = await sql`INSERT INTO albums (name) VALUES (${title}) RETURNING id`;
        data.album_id = newAlbum[0].id;
    }

    // Insert post into the database
    try {
        const post = await sql`INSERT INTO posts ${sql(data)} RETURNING *`;

        // Extract images and videos url from the request if they exist
        if (req.files.image) {
            const images = req.files.image.map(file => ({ url: file.path, album_id: data.album_id, post_id: post[0].id }));
            await sql`INSERT INTO images ${sql(images)}`;
        }
        if (req.files.video) {
            const videos = req.files.video.map(file => ({ title: file.originalname, description: "", url: file.path, album_id: data.album_id, post_id: post[0].id }));
            await sql`INSERT INTO videos ${sql(videos)}`;
        }

        res.status(200).json({
            message: "Post created successfully",
            data: post[0]
        });
    } catch (error) {

        // Remove uploaded files in case of error
        if (req.files.image && req.files.image.length > 0) {
            removeFiles(req.files.image.map(file => file.path));
        } else if (req.files.video && req.files.video.length > 0) {
            removeFiles(req.files.video.map(file => file.path));
        }

        // Remove album if it was created but no post was inserted
        if (newAlbum) {
            await sql`DELETE FROM albums WHERE id=${newAlbum[0].id}`;
        }

        res.status(500).json({
            message: "Error creating post",
            error: error
        });
    }
};