const fs = require('fs');
const path = require('path');
const { tmpUploadsPath } = require('./configs.js');

// Remove files from uploads directory
module.exports.removeFiles = (files) => {
    files.forEach(file => {
        fs.unlink(file, (err) => {
            if (err) {
                throw new Error(`Error deleting file ${file}: ${err.message}`);
            } else {
                console.log(`[INFO] File deleted: ${file}`);
            }
        });
    })
}

// Function to insert media files into the database
module.exports.insertMediaFiles = async (sql, files, postId, albumId) => {

    // Extract images and videos url from the request if they exist
    if (files.image) {
        const images = files.image.map(file => ({ url: file.path, album_id: albumId, post_id: postId }));
        await sql`INSERT INTO images ${sql(images)}`;
    }
    if (files.video) {
        const videos = files.video.map(file => ({ title: file.originalname, description: "", url: file.path, album_id: albumId, post_id: postId, public: true }));
        await sql`INSERT INTO videos ${sql(videos)}`;
    }
}

// Function to remove old media files
module.exports.removeOldMedia = async (mediaArray, type, sql) => {
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