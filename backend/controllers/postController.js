const sql = require('../db/db');
const fs = require('fs');
const path = require('path');
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
    console.log(req.files)
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

// Edit Post
module.exports.editPost = async (req, res) => {
    // Album Steps
    // 1. Check if album is null
    // 2. If album is null, create a new album with the post title
    // 3. If the album is null, and the post has been updated with new album, check the old album if there are posts associated with it
    // 4. If the old album has no posts associated with it, remove the album
    // 5. If the old album has posts associated with it, do not remove the album
    // 6. If the album is the same, do not update the album
    // 7. If the album is different, update the album with the new album name and repeat the steep with step 4

    // Steps
    // 1. Find the post by ID
    // 2. Update the post with new data
    // 3. find the images and videos associated with the post from mediaToRemove
    // 4. Before removing the files, store them in a temporary array to make sure they are revertable if any error occurs
    // 5. Remove the files from the server
    // 6. Add new files to the post if they exist

    // Error Handling
    // If any error occurs during the save operation, remove any new files that were uploaded
    // and revert the post to its previous state and recreate the old album if it was removed
    // If there are media files to be removed, before removing them, store temp to make sure they are revertable if any error occurs

    const { files, body } = req;

    const { post_id } = req.params;

    const { title, content, eventDate, album, album_id, mediaToRemove } = body;
    const oldImage = JSON.parse(mediaToRemove).image;
    const oldVideo = JSON.parse(mediaToRemove).video;
    const { newImage, newVideo } = files;

    // Check if post exists
    const post = await sql`SELECT * FROM posts WHERE id = ${post_id}`;

    if (!post[0]) {
        return res.status(404).json({
            message: "Post not found."
        });
    }

    console.log("Editing post with files:", files);

    // Prepare data for update
    let newAlbum

    // Check if the album of the post needs to be updated
    if (!album) {
        // If the album is not provided, create a new album with the post title
        newAlbum = await sql`INSERT INTO albums (name) VALUES (${title}) RETURNING id`;
    } else if (album && album !== album_id) {
        // If the album is provided and it is different from the current album, update the album
        newAlbum = await sql`SELECT * FROM albums WHERE id = ${album}`;
    }

    // Declare temporary arrays for old images and videos
    const tempImages = [];
    const tempVideos = [];

    try {
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
                await sql`DELETE FROM albums WHERE id = ${post[0].album_id}`;
            }
        }

        // Update the images and videos associated with the post
        if (oldImage.length > 0 || oldVideo.length > 0) {
            if (!fs.existsSync(path.join(__dirname, '../uploads/tmp'))) {
                fs.mkdirSync(path.join(__dirname, '../uploads/tmp'));
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

            // Copying old images and videos to a temporary folder
            for (const image of tempImages) {
                const url = image.url;
                await sql`DELETE FROM images WHERE id = ${image.id}`;
                if (fs.existsSync(url)) {
                    const destination = path.join(process.cwd(), 'uploads/tmp/', path.basename(url));
                    fs.copyFileSync(url, destination); // Copy the file to the temporary folder
                    fs.unlinkSync(url); // Remove the file from the original location
                }
            }

            for (const video of tempVideos) {
                const url = video.url;
                await sql`DELETE FROM videos WHERE id = ${video.id}`;
                if (fs.existsSync(url)) {
                    const destination = path.join(process.cwd(), 'uploads/tmp/', path.basename(url));
                    fs.copyFileSync(url, destination); // Copy the file to the temporary folder
                    fs.unlinkSync(url); // Remove the file from the original location
                }
            }


        }

        // Extract images and videos url from the request if they exist
        if (newImage) {
            const images = newImage.map(file => ({ url: file.path, album_id: updatedPost[0].album_id, post_id: updatedPost[0].id }));
            await sql`INSERT INTO images ${sql(images)}`;
        }
        if (newVideo) {
            const videos = newVideo.map(file => ({ title: file.originalname, description: "", url: file.path, album_id: updatedPost[0].album_id, post_id: updatedPost[0].id }));
            await sql`INSERT INTO videos ${sql(videos)}`;
        }

        // Remove tmp directory if it exists
        if (fs.existsSync(path.join(__dirname, '../uploads/tmp'))) {
            fs.rmSync(path.join(__dirname, '../uploads/tmp'), { recursive: true });
        }

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
        const revertedPost = await sql`UPDATE posts SET title= ${post[0].title}, content = ${post[0].content}, event_date = ${post[0].event_date}, album_id = ${album_id} WHERE id = ${post_id} RETURNING * `;
        await sql`UPDATE images SET album_id = ${album_id} WHERE post_id = ${post_id}`;
        await sql`UPDATE videos SET album_id = ${album_id} WHERE post_id = ${post_id}`;

        // Restore old images and videos from the temporary folder
        for (const image of tempImages) {
            const url = image.url;

            // Check if the file exists in the uploads/images directory, if not copy it from the temporary folder
            // and remove it from the temporary folder
            if (!fs.existsSync(url)) {
                const baseName = path.basename(url);
                const source = path.join('uploads/tmp/', baseName);
                const destination = path.join(process.cwd(), 'uploads/images/', baseName);
                fs.copyFileSync(source, destination); // Copy the file from the temporary folder to the original location
                fs.unlinkSync(source); // Remove the file from the temporary folder
            }

            // Check if the image exists in the database, if not insert it
            const isExistInDB = await sql`SELECT * FROM images WHERE id = ${image.id}`;
            if (!isExistInDB[0]) {
                await sql`INSERT INTO images (id, url, album_id, post_id, created_at) VALUES (${image.id}, ${image.url}, ${album_id}, ${post_id}, ${image.created_at})`;
            }
        }

        for (const video of tempVideos) {
            const url = video.url;

            // Check if the file exists in the uploads/videos directory, if not copy it from the temporary folder
            // and remove it from the temporary folder
            if (!fs.existsSync(url)) {
                const baseName = path.basename(url);
                const source = path.join('uploads/tmp/', baseName);
                const destination = path.join(process.cwd(), 'uploads/videos/', baseName);
                fs.copyFileSync(source, destination); // Copy the file from the temporary folder to the original location
                fs.unlinkSync(source); // Remove the file from the temporary folder
            }

            // Check if the video exists in the database, if not insert it
            const isExistInDB = await sql`SELECT * FROM videos WHERE id = ${video.id}`;
            if (!isExistInDB[0]) {
                await sql`INSERT INTO videos (id, title, description, url, album_id, post_id, event_date, created_at) VALUES (${video.id}, ${video.title}, ${video.description}, ${video.url}, ${album_id}, ${post_id}, ${video.event_date}, ${video.created_at})`;
            }
        }

        // Remove uploaded files in case of error
        if (newImage && newImage.length > 0) {
            removeFiles(newImage.map(file => file.path));
        } else if (newVideo && newVideo.length > 0) {
            removeFiles(newVideo.map(file => file.path));
        }

        // Remove tmp directory if it exists
        if (fs.existsSync(path.join(__dirname, '../uploads/tmp'))) {
            fs.rmSync(path.join(__dirname, '../uploads/tmp'), { recursive: true });
        }

        return res.status(500).json({
            message: "Error updating post",
            error: error
        });
    }




    res.status(500).json({
        message: "Edit post functionality is not implemented yet."
    });



};