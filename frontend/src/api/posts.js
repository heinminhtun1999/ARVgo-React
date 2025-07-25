import instance from './axios';

const axios = instance;

export const createPost = async (data) => {
    try {
        const response = await axios.post("/posts", data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response
    } catch (error) {
        throw error.response || {
            status: 500,
            message: "An error occurred while creating the post."
        };
    }
}

export const getAllPosts = async (params) => {
    try {
        let url = "/posts?";

        Object.keys(params).forEach((key, i) => {
            url += `${key}=${params[key]}&`;
        });

        const response = await axios.get(url);
        return response
    } catch (error) {
        throw error.response || {
            status: 500,
            message: "An error occurred while fetching posts."
        };
    }
}

export const getPost = async (id) => {
    try {
        const response = await axios.get(`/posts/${id}`);
        return response;
    } catch (error) {
        throw error.response || {
            status: 500,
            message: "An error occurred while fetching the post."
        }
    }
}

export const editPost = async (id, data) => {
    try {
        const response = await axios.patch(`/posts/${id}`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
            }
        });
        return response;
    } catch (error) {
        throw error.response || {
            status: 500,
            message: "An error occurred while editing the post."
        }
    }
}