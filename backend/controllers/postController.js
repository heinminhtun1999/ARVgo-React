const sql = require('../db/db');
const fs = require('fs');
const path = require('path');
const { removeFiles, insertMediaFiles, removeMediaFromPost, restoreMediaFiles, removeCreatedMediaFromDB } = require("../utils/utils.js");
const { tmpUploadsPath } = require("../utils/configs.js");

// Function to get a post by ID
async function getPost(postId) {
    const query = sql`SELECT 
                                posts.id as id,
                                posts.title as title,
                                to_char(posts.event_date, 'YYYY-MM-DD') as event_date,
                                ARRAY_AGG(DISTINCT images.id) FILTER (WHERE images.id IS NOT NULL) AS image_id,
                                ARRAY_AGG(DISTINCT images.url) FILTER (WHERE images.url IS NOT NULL) AS images,
                                ARRAY_AGG(DISTINCT videos.id) FILTER (WHERE videos.id IS NOT NULL) AS video_id,
                                ARRAY_AGG(DISTINCT videos.url) FILTER (WHERE videos.url IS NOT NULL) AS videos,
                                albums.name as album,
                                albums.id as album_id,
                                posts.content as content
                            FROM posts
                            LEFT JOIN images ON posts.id = images.post_id
                            LEFT JOIN videos ON posts.id = videos.post_id
                            LEFT JOIN albums ON posts.album_id = albums.id
                            WHERE posts.id = ${postId}
                            GROUP BY posts.id, albums.name, albums.id;`;

    const post = await query;

    return post;
}


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

        // Base query to fetch posts with filtering and pagination
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

        // Add filters based on event date, start date and end date
        if (eventDate) {
            baseQuery += ` AND to_char(posts.event_date, 'YYYY-MM-DD') = $${paramIndex}`;
            params.push(eventDate);
            paramIndex++;
        }

        // Add filters for start date and end date
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

        // Find the length of matching posts
        const lengthQuery = baseQuery + ` GROUP BY posts.id, albums.name`;
        const fetchedLength = await sql.unsafe(lengthQuery, params);

        // Get the posts with pagination and sorting
        const postsQuery = lengthQuery + ` ORDER BY ${sortingField} ${sortingOrders} LIMIT ${limit} OFFSET ${offset}`;
        const posts = await sql.unsafe(postsQuery, params);

        res.status(200).json({
            message: "Posts fetched successfully",
            data: {
                posts,
                fetchedLength: fetchedLength.length
            },
            error: null
        });

    } catch (error) {
        console.error("[INFO] Error fetching posts:", error);
        res.status(500).json({ message: "An error occurred while fetching posts.", error: error, data: null });
    }
}


// Get Post
module.exports.getPost = async (req, res) => {
    const { post_id } = req.params;

    try {
        const post = await getPost(post_id);

        res.status(200).json({
            message: "Post fetched successfully",
            data: post,
            error: null
        })

    } catch (error) {
        console.error("[INFO] Error fetching post:", error);
        res.status(500).json({ message: "An error occurred while fetching post.", error: error, data: null });
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
    };

    let newAlbum, createdMediaIds, post;

    // Insert post into the database
    try {

        // Check if the album exists, if not create a new album
        if (album) {
            data.album_id = album
        } else {
            newAlbum = await sql`INSERT INTO albums (name) VALUES (${title}) RETURNING id`;
            data.album_id = newAlbum[0].id;
        }

        post = await sql`INSERT INTO posts ${sql(data)} RETURNING *`;

        // Insert media files into the database
        createdMediaIds = await insertMediaFiles(sql, req.files, post[0].id, data.album_id);

        res.status(200).json({
            message: "Post created successfully",
            data: post[0],
            error: null
        });
    } catch (error) {

        console.error("[INFO] Error creating post:", error);

        // Remove uploaded images and videos in case of error
        removeFiles(req.files.image);
        removeFiles(req.files.video);
        if (post && createdMediaIds) {
            await removeCreatedMediaFromDB(createdMediaIds, post[0].id, sql);
        }

        // Remove album if it was created but no post was inserted
        if (newAlbum) {
            await sql`DELETE FROM albums WHERE id=${newAlbum[0].id}`;
        }

        res.status(500).json({
            message: "Error creating post",
            error: error,
            data: null
        });
    }
};

// Edit Post
module.exports.editPost = async (req, res) => {

    const { files, body } = req;

    const { post_id } = req.params;

    const { title, content, eventDate, album, album_id, mediaToRemove } = body; // album_id: posts's current album id, album: new album id if provided
    const oldImage = JSON.parse(mediaToRemove).image;
    const oldVideo = JSON.parse(mediaToRemove).video;

    // Declare temporary arrays for old images and videos
    const tempImages = [];
    const tempVideos = [];

    // Declare temporary array to store id of newly created medias
    let createdMediaIds;

    // Check if post exists
    const post = await sql`SELECT * FROM posts WHERE id = ${post_id}`;

    if (!post[0]) {
        return res.status(404).json({
            message: "Post not found.",
            error: null,
            data: null
        });
    }

    // Prepare data for update
    let newAlbum

    try {

        // Check if the album of the post needs to be updated
        if (!album) {
            // If the album is not provided, create a new album with the post title
            newAlbum = await sql`INSERT INTO albums (name) VALUES (${title}) RETURNING id`;
        } else if (album && album !== album_id) {
            // If the album is provided and it is different from the current album, update the album
            newAlbum = await sql`SELECT * FROM albums WHERE id = ${album}`;
        }

        // Update the post with new data
        const updatedPost = await sql`UPDATE posts SET title= ${title}, content = ${content}, event_date = ${eventDate}, album_id = ${newAlbum ? newAlbum[0].id : album_id} WHERE id = ${post_id} RETURNING *`;

        // If the new album is created, remove the old album if it has no posts, images and videos associated with it
        if (newAlbum) {
            // Update the album_id of images and videos that are associated with the post to the new album
            await sql`UPDATE images SET album_id = ${newAlbum[0].id} WHERE post_id = ${post_id}`;
            await sql`UPDATE videos SET album_id = ${newAlbum[0].id} WHERE post_id = ${post_id}`;

            // Check if the old album has any posts, images or videos associated with it
            const associatedPosts = await sql`SELECT COUNT(*) FROM posts WHERE album_id = ${album_id}`;
            const associatedImages = await sql`SELECT COUNT(*) FROM images WHERE album_id = ${album_id}`;
            const associatedVideos = await sql`SELECT COUNT(*) FROM videos WHERE album_id = ${album_id}`;

            // If the old album has no posts, images or videos associated with it, remove the album
            if (associatedPosts[0].count == 0 && associatedImages[0].count == 0 && associatedVideos[0].count == 0) {
                await sql`DELETE FROM albums WHERE id = ${album_id}`;
            }
        }


        // Remove the images and videos associated with the post
        if (oldImage.length > 0 || oldVideo.length > 0) {
            if (!fs.existsSync(tmpUploadsPath)) {
                fs.mkdirSync(tmpUploadsPath);
            }
            // Fetch old images and videos from the database and store them in a temporary array
            for (const image of oldImage) {
                const i = await sql`SELECT * FROM images WHERE id = ${image}`;
                tempImages.push(i[0]);
            }

            for (const video of oldVideo) {
                const v = await sql`SELECT * FROM videos WHERE id = ${video}`;
                tempVideos.push(v[0]);
            }

            // Remove media files from the database
            await removeMediaFromPost(tempImages, 'images', sql);
            await removeMediaFromPost(tempVideos, 'videos', sql);
        }

        // Insert new media files into the database and get their IDs
        createdMediaIds = await insertMediaFiles(sql, files, updatedPost[0].id, updatedPost[0].album_id);

        // Remove tmp directory if it exists
        if (fs.existsSync(tmpUploadsPath)) {
            fs.rmSync(tmpUploadsPath, { recursive: true });
        }

        const post = await getPost(post_id);

        res.status(200).json({
            message: "Post updated successfully",
            data: post,
            error: null
        });

    } catch (error) {
        console.error("[INFO] Error updating post:", error);
        // If an error occurs, remove newly created album if any.
        if (newAlbum) {
            await sql`DELETE FROM albums WHERE id = ${newAlbum[0].id}`;

            // Check if the old album has been removed, if so, recreate it with the old data
            const oldAlbum = await sql`SELECT * FROM albums WHERE id = ${album_id}`;
            if (!oldAlbum[0]) {
                await sql`INSERT INTO albums (id, name, created_at) VALUES (${album_id}, ${post[0].title}, ${post[0].created_at})`;
            }
        }

        // Revert the post and its media files to the previous state
        await sql`UPDATE posts SET title= ${post[0].title}, content = ${post[0].content}, event_date = ${post[0].event_date}, album_id = ${album_id} WHERE id = ${post_id} RETURNING * `;
        await sql`UPDATE images SET album_id = ${album_id} WHERE post_id = ${post_id}`;
        await sql`UPDATE videos SET album_id = ${album_id} WHERE post_id = ${post_id}`;

        // Restore old images and videos from the temporary folder
        await restoreMediaFiles(tempImages, 'images', sql, post_id, album_id);
        await restoreMediaFiles(tempVideos, 'videos', sql, post_id, album_id);

        // Remove uploaded files in case of error
        // Remove uploaded images and videos in case of error
        removeFiles(files.image);
        removeFiles(files.video);
        if (createdMediaIds) {
            await removeCreatedMediaFromDB(createdMediaIds, post_id, sql);
        }

        // Remove tmp directory if it exists
        if (fs.existsSync(tmpUploadsPath)) {
            fs.rmSync(tmpUploadsPath, { recursive: true });
        }

        const originalPost = await getPost(post_id);

        return res.status(500).json({
            message: "Error updating post",
            error: error,
            data: originalPost
        });
    }
};