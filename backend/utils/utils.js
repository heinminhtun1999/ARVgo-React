const fs = require('fs');
const path = require('path');
const { tmpUploadsPath } = require('./configs.js');

// Remove files from uploads directory
module.exports.removeFiles = async (files) => {

    if (files && files.length > 0) {
        const filesPaths = files.map(file => file.path);
        filesPaths.forEach(file => {
            fs.unlinkSync(file, (err) => {
                if (err) {
                    throw new Error(`Error deleting file ${file}: ${err.message}`);
                } else {
                    console.log(`[INFO] File deleted: ${file}`);
                }
            });
        });
    }
}

// Function to insert media files into the database
module.exports.insertMediaFiles = async (sql, files, postId, albumId) => {

    let imageIds = [];
    let videoIds = [];

    // Extract images and videos url from the request if they exist
    if (files.image) {
        const images = files.image.map(file => ({ url: file.path, album_id: albumId, post_id: postId }));
        imageIds = await sql`INSERT INTO images ${sql(images)} RETURNING id`;
    }
    if (files.video) {
        const videos = files.video.map(file => ({ title: file.originalname, description: "", url: file.path, album_id: albumId, post_id: postId, public: true }));
        videoIds = await sql`INSERT INTO videos ${sql(videos)} RETURNING id`;
    }

    return {
        imageIds,
        videoIds
    }
}

// Function to remove old media files
module.exports.removeMediaFromPost = async (mediaArray, type, sql) => {
    for (const media of mediaArray) {
        const url = media.url;

        // Use dynamic SQL construction for table name since it cannot be parameterized
        if (type === 'images') {
            await sql`DELETE FROM images WHERE id = ${media.id}`;
        } else if (type === 'videos') {
            await sql`DELETE FROM videos WHERE id = ${media.id}`;
        } else {
            throw new Error(`Invalid media type: ${type}`);
        }

        if (fs.existsSync(url)) {
            const destination = path.join(tmpUploadsPath, path.basename(url));
            fs.copyFileSync(url, destination); // Copy the file to the temporary folder
            fs.unlinkSync(url); // Remove the file from the original location
        }
    }
}


// Function to restore media files from the temporary folder
module.exports.restoreMediaFiles = async (mediaArray, type, sql, post_id, album_id) => {

    for (const media of mediaArray) {
        const url = media.url;

        // Check if the file exists in the uploads directory, if not copy it from the temporary folder
        // and remove it from the temporary folder
        if (!fs.existsSync(url)) {
            const baseName = path.basename(url);
            const source = path.join('uploads/tmp/', baseName);
            const destination = path.join(process.cwd(), `uploads/${type}/`, baseName);
            fs.copyFileSync(source, destination); // Copy the file from the temporary folder to the original location
            fs.unlinkSync(source); // Remove the file from the temporary folder
        }

        // Check if the media exists in the database, if not insert it
        if (type === 'images') {
            const isExistInDB = await sql`SELECT * FROM images WHERE id = ${media.id}`;
            if (!isExistInDB[0]) {
                await sql`INSERT INTO images (id, url, album_id, post_id, created_at) VALUES (${media.id}, ${media.url}, ${album_id}, ${post_id}, ${media.created_at})`;
            }
        } else if (type === 'videos') {
            const isExistInDB = await sql`SELECT * FROM videos WHERE id = ${media.id}`;
            if (!isExistInDB[0]) {
                await sql`INSERT INTO videos (id, title, description, url, album_id, post_id, event_date, public, created_at) VALUES (${media.id}, ${media.title}, ${media.description}, ${media.url}, ${album_id}, ${post_id}, ${media.event_date}, ${media.public}, ${media.created_at})`;
            }
        }
    }
}

// Function to remove newly created media files from the database
module.exports.removeCreatedMediaFromDB = async (mediaIds, post_id, sql) => {
    const { imageIds, videoIds } = mediaIds;

    for (const i of imageIds) {
        await sql`DELETE FROM images WHERE id = ${i.id}`;
    }
    for (const i of videoIds) {
        await sql`DELETE FROM videos WHERE id = ${i.id}`;
    }
};