// React
import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";

// API 
import { getPost, editPost } from "../../api/posts.js";
import { getAllAlbums } from "../../api/albums.js";

// Components
import Loading from '../../components/dashboard/Loading.jsx';
import QuillEditor from '../../components/dashboard/QuillEditor.jsx';
import TextInput from '../../components/dashboard/TextInput.jsx';
import DatePicker from '../../components/dashboard/DatePicker.jsx';
import ErrorAlert from '../../components/dashboard/ErrorAlert.jsx';
import PrimaryButton from '../../components/dashboard/Buttons/PrimaryButton.jsx';
import { FaImages, FaMinus } from "react-icons/fa";

// Utils
import { validateFile } from '../../utils/utils.js';

const API_URL = import.meta.env.VITE_BASE_URL;

function Post() {

    const { post_id } = useParams();
    const location = useLocation();

    const [editorDraft, setEditorDraft] = useState({ title: "", content: "", eventDate: "", album: "", album_id: "" }); // album_id = current album id
    const [displayMedia, setDisplayMedia] = useState({ image: { id: [], url: [] }, video: { id: [], url: [] } });
    const [mediaToAdd, setMediaToAdd] = useState({ image: [], video: [] });
    const [mediaToRemove, setMediaToRemove] = useState({ image: [], video: [] });
    const [inputError, setInputError] = useState({ title: "", content: "", eventDate: "", media: "", album: "" });
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [albumLoading, setAlbumLoading] = useState(true);
    const [error, setError] = useState(null);

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

        async function getAlbums() {
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
        getAlbums();

        fetchPost();
    }, []);

    const states = JSON.parse(location.state);
    const navigate = useNavigate();

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

    function handleAlbumChange(e) {
        const album = e.target.value;
        console.log("Selected Album:", album);
        setEditorDraft(prev => ({
            ...prev,
            album: album
        }));
    }

    // Media Handlers
    function fileChangeHandler(e) {
        const files = e.target.files;

        let [validFiles, invalidFiles] = validateFile(files);


        if (invalidFiles.length > 0) {
            setInputError(prev => ({
                ...prev,
                media: `The following files are too large and have been removed (max 20MB): ${invalidFiles.slice(0, 2).join(", ")}${invalidFiles.length > 2 ? ` and ${invalidFiles.length - 2} more.` : ""}`
            }));
        }

        // Check file formats and store in editorDraft
        const imageFormats = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
        const videoFormats = ["video/mp4", "video/webm"];

        if (validFiles.length > 0) {
            for (const file of validFiles) {

                const fileType = file.type; // get the file type

                // check file type and add to respective media array
                if (imageFormats.includes(fileType)) {
                    // add to array
                    setMediaToAdd(prev => ({
                        ...prev, // preserve existing state
                        image: [...prev.image, file]
                    }));

                    // update display media
                    setDisplayMedia(prev => {
                        console.log("prev", prev);
                        return {
                            ...prev,
                            image: {
                                id: [...prev.image.id, null],
                                url: [...prev.image.url, URL.createObjectURL(file)]
                            }
                        };
                    });

                } else if (videoFormats.includes(fileType)) {
                    setMediaToAdd(prev => ({
                        ...prev, // preserve existing state
                        video: [...prev.video, file]
                    }));

                    // update display media
                    setDisplayMedia(prev => ({
                        ...prev,
                        video: {
                            id: [...prev.video.id, null],
                            url: [...prev.video.url, URL.createObjectURL(file)]
                        }
                    }));
                }

            }

        }
    }

    // Image remove handler
    function handleRemoveMedia(type, id) {
        const isStoredInDB = displayMedia[type].id[id]; // Get id of the media to check if it is stored in the database

        // Check if the media is created before 
        // If it is not stored in the database, remove it from the mediaToAdd state
        if (!isStoredInDB) {

            // Updating the mediaToAdd array
            const updatedArray = [...mediaToAdd[type]]; // Create a copy of the array of media to add
            updatedArray.splice(id, 1); // Remove the media at the specified index
            setMediaToAdd(prev => ({
                ...prev,
                [type]: updatedArray
            }));

            // Updating the display media
            const updatedDisplayMedia = { ...displayMedia[type] }; // Create a copy of the display media
            updatedDisplayMedia.id.splice(id, 1); // Remove the id at the specified index
            updatedDisplayMedia.url.splice(id, 1); // Remove the URL at the specified index
            setDisplayMedia(prev => ({
                ...prev,
                [type]: updatedDisplayMedia
            }));

        } else {
            // If the media is stored in the database, add it to the mediaToRemove state
            setMediaToRemove(prev => ({
                ...prev,
                [type]: [...prev[type], isStoredInDB] // Add the id of the media to remove
            }))

            // Remove from display media
            const updatedDisplayMedia = { ...displayMedia[type] }; // Create a copy of the display media
            updatedDisplayMedia.id.splice(id, 1); // Remove the id at the specified index
            updatedDisplayMedia.url.splice(id, 1); // Remove the URL at the specified index
            setDisplayMedia(prev => ({
                ...prev,
                [type]: updatedDisplayMedia
            }));
        }
    }


    // Handle form submission
    async function handleEditSubmission() {
        // If Title Or Content is empty, set input error
        if (!editorDraft.title || !editorDraft.content) {
            setInputError(prev => ({
                ...prev,
                title: !editorDraft.title ? "Title is required." : "",
                content: !editorDraft.content ? "Content is required." : "",
            }))
            return;
        }

        const form = new FormData();
        form.append("title", editorDraft.title);
        form.append("content", editorDraft.content);
        form.append("eventDate", editorDraft.eventDate);
        form.append("album", editorDraft.album);
        form.append("album_id", editorDraft.album_id);
        form.append("mediaToRemove", JSON.stringify(mediaToRemove));
        mediaToAdd.image.forEach(image => form.append("newImage", image));
        mediaToAdd.video.forEach(video => form.append("newVideo", video));

        let response;

        try {
            response = await editPost(post_id, form);
            setInputError({ title: "", content: "", eventDate: "", media: "" }); // Reset input errors
        } catch (error) {
            console.error("Error editing post:", error);
            setError("Failed to edit post. Please try again. Check console for more details.");
        }

    }

    return (
        <div>

            {/* Error Box */}
            {
                error && <ErrorAlert error={error} setError={setError} />
            }

            {/* Main Content */}
            {
                loading
                    ?
                    <Loading />
                    :
                    (
                        <div className="flex flex-col gap-3">
                            <div className="w-full flex items-center justify-end">
                                <button
                                    className="px-4 py-2 bg-primary-green-200 text-white rounded hover:bg-primary-green-200/90 cursor-pointer"
                                    onClick={() => navigate('/admin/posts', { state: JSON.stringify(states) })}>Back</button>
                            </div>
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
                                {albumLoading && <span className="text-gray-500 text-sm">Loading Albums...</span>}
                            </div>

                            {/* Media */}
                            <div>
                                <label className="text-gray-700 font-bold text-md text-nowrap">Media:</label>
                                <div className="w-full max-h-[500px] border border-gray-300 rounded p-2 grid grid-cols-5 grid-rows-auto gap-3 overflow-auto">
                                    <div className="aspect-square flex flex-col items-center justify-center border border-gray-300 cursor-pointer hover:shadow-sm hover:bg-gray-50 rounded p-3" onClick={() => document.getElementById("media-input").click()}>
                                        <FaImages className="text-4xl text-gray-500 mb-2" />
                                        <p className="text-gray-500 select-none">upload</p>
                                        <input
                                            id="media-input"
                                            type="file"
                                            accept=".jpg, .jpeg, .png, .gif, .mp4, .webm"
                                            multiple
                                            className="border border-gray-300 rounded p-2 mb-2 w-full h-full hidden"
                                            onChange={fileChangeHandler}
                                        />
                                    </div>

                                    {/* Display Media */}
                                    {(displayMedia.image.url) && (
                                        displayMedia.image.url.map((image, index) => (
                                            <div key={index} className="relative aspect-square hover:shadow-lg cursor-pointer hover:transform hover:scale-105 transition-transform duration-200 ease-in-out">
                                                <div
                                                    title="Remove"
                                                    className="absolute right-0 top-0 bg-red-500 hover:bg-red-400 cursor-pointer rounded-full p-1 z-10"
                                                    onClick={() => handleRemoveMedia("image", index)} >
                                                    <FaMinus className="w-[10px] h-[10px]" />
                                                </div>
                                                <img
                                                    src={(displayMedia.image.id[index] ? API_URL + "/" : "") + image}
                                                    alt={`Image ${index + 1}`}
                                                    className="w-full h-full object-cover rounded-md border-3 border-gray-300 select-none"
                                                    onClick={() => window.open((displayMedia.image.id[index] ? API_URL + "/" : "") + image, "_blank")}
                                                    draggable="false"
                                                />
                                            </div>
                                        ))
                                    )}
                                    {(displayMedia.video.url) &&
                                        (displayMedia.video.url.map((video, index) => (
                                            <div key={index} className="relative aspect-square hover:shadow-lg cursor-pointer hover:transform hover:scale-105 transition-transform duration-200 ease-in-out">
                                                <div
                                                    title="Remove"
                                                    className="absolute right-0 top-0 bg-red-500 hover:bg-red-400 cursor-pointer rounded-full p-1 z-10"
                                                    onClick={() => handleRemoveMedia("video", index)} >
                                                    <FaMinus className="w-[10px] h-[10px]" />
                                                </div>
                                                <video
                                                    src={(displayMedia.video.id[index] ? API_URL + "/" : "") + video}
                                                    controls
                                                    className="w-full h-full object-cover rounded-md border-3 border-gray-300 select-none"
                                                    draggable="false"
                                                    onClick={() => window.open((displayMedia.video.id[index] ? API_URL + "/" : "") + video, "_blank")}
                                                />
                                            </div>
                                        ))
                                        )}
                                </div>

                                {/* Error Label */}
                                {inputError.media && <span className="text-red-500 text-sm">{inputError.media}</span>}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end w-full mt-5 gap-3">
                                <PrimaryButton text="Submit" onClick={handleEditSubmission} disabled={!editorDraft} />
                            </div>
                        </div>
                    )
            }
        </div>
    )
}

export default Post;