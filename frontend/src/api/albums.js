import instance from './axios';

const axios = instance;

export const getAllAlbums = async () => {
    try {
        const response = await axios.get("/albums");
        return response
    } catch (error) {
        throw error.response || {
            status: 500,
            message: "An error occurred while fetching albums."
        };
    }
}