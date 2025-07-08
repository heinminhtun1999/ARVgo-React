const sql = require('../db/db');
const { removeFiles } = require("../utils/utils.js");

module.exports.getAllAlbums = async (req, res) => {
    try {
        const albums = await sql`SELECT * FROM albums`;// Get all albums from the database
        res.status(200).json({
            message: "Albums fetched successfully",
            data: albums
        });
    } catch (error) {
        console.error("[INFO] Error fetching albums:", error);
        res.status(500).json({ message: "An error occurred while fetching albums." });
    }
}