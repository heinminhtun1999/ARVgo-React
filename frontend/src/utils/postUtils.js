import { getAllAlbums } from "../api/albums.js";
import { getPost } from "../api/posts.js";

export async function fetchPost(post_id, setEditorDraft, setDisplayMedia, setLoading, setError) {
    setLoading(true);
    try {
        const response = await getPost(post_id);
        const post = response.data.data[0];

        setEditorDraft({
            title: post.title,
            content: post.content,
            eventDate: post.event_date,
            album: post.album_id,
            album_id: post.album_id
        });

        // Update to display media
        setDisplayMedia({
            image: {
                id: post.image_id || [],
                url: post.images || []
            },
            video: {
                id: post.video_id || [],
                url: post.videos || []
            }
        });

    } catch (error) {
        console.error("Error fetching post:", error);
        setError("Failed to fetch posts. Please try again. Check console for more details.");
    }
    setLoading(false);
}

export async function getAlbums(setAlbums, setAlbumLoading, setInputError) {
    setAlbumLoading(true);
    try {
        const response = await getAllAlbums();
        setAlbums(response.data.data);
    } catch (error) {
        console.error("[INFO] Error fetching albums:", error);
        setInputError(prev => ({
            ...prev,
            album: "Error fetching albums. Create new album from title name or try again."
        }))
    }
    setAlbumLoading(false);
}