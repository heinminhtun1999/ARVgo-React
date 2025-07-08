// React
import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";

// API 
import { getPost } from "../../api/posts.js";
import { getAllAlbums } from "../../api/albums.js";

// Components
import Loading from '../../components/dashboard/Loading.jsx';
import QuillEditor from '../../components/dashboard/QuillEditor.jsx';
import TextInput from '../../components/dashboard/TextInput.jsx';
import DatePicker from '../../components/dashboard/DatePicker.jsx';


function Post() {

    const { post_id } = useParams();
    const location = useLocation();
    const [editorDraft, setEditorDraft] = useState({ title: "", content: "", media: { image: [], video: [] }, eventDate: "", album: "", album_id: "" });
    const [mediaToAdd, setMediaToAdd] = useState({ image: [], video: [] });
    const [mediaToRemove, setMediaToRemove] = useState({ image: [], video: [] });
    const [inputError, setInputError] = useState({ title: "", content: "", eventDate: "", media: "", album: "" });
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    const states = JSON.parse(location.state)
    useEffect(() => {
        async function fetchPost() {
            setLoading(true);
            try {
                const response = await getPost(post_id);
                const post = response.data.data[0];
                setEditorDraft({
                    title: post.title,
                    content: post.content,
                    media: { image: post.images, video: post.videos },
                    eventDate: post.event_date,
                    album: post.album,
                    album_id: post.album_id
                })
            } catch (error) {
                console.error("Error fetching post:", error);
            }
            setLoading(false);
        }

        async function getAlbums() {
            setLoading(true);
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
            setLoading(false);
        }
        getAlbums();

        fetchPost();
    }, []);

    // Input Handlers 
    function handleTextInputChange(e) {
        setEditorDraft(prev => ({
            ...prev,
            title: e.target.value
        }))
    }

    function handleDateChange(e) {
        setEditorDraft(prev => ({
            ...prev,
            eventDate: e.target.value
        }))
    }

    const handleAlbumChange = (e) => {
        const album = e.target.value;
        setEditorDraft(prev => ({
            ...prev,
            album: album
        }));
    }

    return (
        <div>
            {
                loading
                    ?
                    <Loading />
                    :
                    (
                        <div className="flex flex-col gap-3">

                            {/* Title Input */}
                            <div className="w-full">
                                <TextInput onChange={handleTextInputChange} value={editorDraft.title} placeholder="Post Title" />
                                {/* Error Label */}
                                {inputError.title && <span className="text-red-500 text-sm">{inputError.title}</span>}
                            </div>

                            {/* Date Picker */}
                            <div className="flex items-center justify-start w-full gap-3">
                                <label className="text-gray-700 font-bold text-md text-nowrap ">Event Date:</label>
                                <DatePicker value={editorDraft.eventDate} handleDateChange={handleDateChange} className="mb-5" />
                            </div>

                            {/* Quill Editor */}
                            <div className="flex flex-col">
                                <QuillEditor editorDraft={editorDraft} setEditorDraft={setEditorDraft} />
                                {/* Error Label */}
                                {inputError.content && <span className="text-red-500 text-sm">{inputError.content}</span>}
                            </div>


                            {/* Album Selection */}
                            <div className="w-full">
                                <label className="text-gray-700 font-bold text-md text-nowrap">Album:</label>
                                <select className="w-full p-2 text-gray-700 border border-gray-300 focus:outline-none focus:border-primary-green-400 mt-1"
                                    onChange={handleAlbumChange}
                                >
                                    <option value="">New</option>
                                    {albums.map((album, index) => (
                                        <option key={index} value={album.id} selected={album.id === editorDraft.album_id}>{album.name}</option>
                                    ))}
                                </select>

                                {/* Error Label */}
                                {inputError.album && <span className="text-red-500 text-sm">{inputError.album}</span>}

                                {/* Loading Labe */}
                                {loading && <span className="text-gray-500 text-sm">Loading Albums...</span>}
                            </div>

                            {/* Media */}

                        </div>
                    )
            }
        </div>
    )
}

export default Post;