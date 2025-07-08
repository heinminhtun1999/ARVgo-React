const fs = require('fs');

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