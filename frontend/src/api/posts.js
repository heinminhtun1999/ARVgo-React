import instance from './axios';

const axios = instance;

export const createPost = async (data) => {
    try {
        const response = await axios.post("/posts", data)

        // Check if the response is successful
        if (response && response.status != 200) throw error.response

        return response
    } catch (error) {
        throw error.response || {
            status: 500,
            message: "An error occurred while creating the post."
        };
    }
}
