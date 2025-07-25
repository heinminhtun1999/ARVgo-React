// React 
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from "react-router-dom";

// Components
import PrimaryButton from './Buttons/PrimaryButton.jsx';
import SecondaryButton from './Buttons/SecondaryButton.jsx';
import DatePicker from './DatePicker.jsx';
import TextInput from './TextInput.jsx';
import QuillEditor from './QuillEditor.jsx';
import { FaMinus } from "react-icons/fa";

// API
import { createPost } from '../../api/posts.js';
import { getAllAlbums } from '../../api/albums.js';

// Utils
import { validateFile } from '../../utils/utils.js';


function AddPostOverlay({ setShowAddPanel, editorDraft, setEditorDraft, setError, state }) {

    const [inputError, setInputError] = useState({ title: "", content: "", eventDate: "", media: "", album: "" });
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {

        // Get Albums
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

    }, [])


    // Handle Title, Date and Album Change
    function handleTitleChange(e) {
        const title = e.target.value;
        setEditorDraft(prev => ({
            ...prev,
            title: title
        }));
    }

    function handleDateChange(e) {
        const eventDate = e.target.value;
        setEditorDraft(prev => ({
            ...prev,
            eventDate: eventDate
        }));
    }

    function handleAlbumChange(e) {
        const album = e.target.value;
        setEditorDraft(prev => ({
            ...prev,
            album: album
        }));
    }

    // Handle File Change
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
                const fileType = file.type;
                if (imageFormats.includes(fileType)) {
                    setEditorDraft(prev => ({
                        ...prev,
                        media: {
                            ...prev.media,
                            image: [...prev.media.image, file]
                        }
                    }));
                } else if (videoFormats.includes(fileType)) {
                    setEditorDraft(prev => ({
                        ...prev,
                        media: {
                            ...prev.media,
                            video: [...prev.media.video, file]
                        }
                    }));
                }
            }
        }
    }

    // Handle Remove Media
    function handleRemoveMedia(type, index) {
        setEditorDraft(prev => {
            const updatedMedia = {
                image: [...prev.media.image],
                video: [...prev.media.video]
            };
            // Remove the media item based on type and index
            updatedMedia[type].splice(index, 1);
            return {
                ...prev,
                media: updatedMedia
            }
        })
    }

    // Handle Post Submission
    async function handlePostSubmission() {

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
        editorDraft.media.image.forEach(image => form.append("image", image));
        editorDraft.media.video.forEach(video => form.append("video", video));

        try {
            const response = await createPost(form);
            const message = JSON.stringify({ ...state, message: response.data.message });
            navigate(`${location.pathname}/${response.data.data.id}`, { state: message }); // Redirect to the newly created post or update state
            setShowAddPanel(false); // Close the overlay after successful post creation
            setEditorDraft({ title: "", content: "", media: { image: [], video: [] }, eventDate: "", album: "" }); // Clear the editor draft state
            setInputError({ title: "", content: "", eventDate: "", media: "" }); // Reset input errors
        } catch (error) {
            console.error("Failed to create post:", error);
            setError("Failed to create post. Please try again. Check console for more details.");
        }
    }


    return (
        <div className="fixed top-0 left-0 w-lvw h-lvh bg-black/50 z-30 flex items-center justify-center p-10"
            onClick={() => setShowAddPanel(false)}
        >
            <div className="w-1/2 h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-5 overflow-auto" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-3xl font-bold mb-10 text-gray-700">Add New Post</h2>

                {/* Title Input */}
                <div className="w-full mb-5">
                    <TextInput onChange={handleTitleChange} value={editorDraft.title} placeholder="Post Title" />
                    {/* Error Label */}
                    {inputError.title && <span className="text-red-500 text-sm">{inputError.title}</span>}
                </div>

                {/* Date Picker */}
                <div className="flex items-center justify-start w-full mb-5 gap-3">
                    <label className="text-gray-700 font-bold text-md text-nowrap ">Event Date:</label>
                    <DatePicker value={editorDraft.eventDate} handleDateChange={handleDateChange} className="mb-5" />
                </div>

                {/* Quill Editor */}
                <div className="flex flex-col min-h-[300px] w-full overflow-hidden">
                    <QuillEditor editorDraft={editorDraft} setEditorDraft={setEditorDraft} />
                    {/* Error Label */}
                    {inputError.content && <span className="text-red-500 text-sm">{inputError.content}</span>}
                </div>

                {/* Album Selection */}
                <div className="w-full mt-5">
                    <label className="text-gray-700 font-bold text-md text-nowrap">Album:</label>
                    <select className="w-full p-2 text-gray-700 border border-gray-300 focus:outline-none focus:border-primary-green-400 mt-1"
                        onChange={handleAlbumChange}
                    >
                        <option value="">New</option>
                        {albums.map((album, index) => (
                            <option key={index} value={album.id}>{album.name}</option>
                        ))}
                    </select>

                    {/* Error Label */}
                    {inputError.album && <span className="text-red-500 text-sm">{inputError.album}</span>}

                    {/* Loading Labe */}
                    {loading && <span className="text-gray-500 text-sm">Loading Albums...</span>}
                </div>

                {/* File Input */}
                <div className="mt-5 w-full">
                    <div>
                        <label className="text-gray-700 font-bold text-md text-nowrap">Media:</label>
                        <input type="file" className="w-full p-2 text-gray-700 border border-gray-300 mb-5 focus:outline-none focus:border-primary-green-400 mt-1"
                            accept=".jpg, .jpeg, .png, .gif, .mp4, .webm"
                            multiple
                            onChange={fileChangeHandler}
                        />
                    </div>
                    {/* Display selected media files */}
                    {(editorDraft.media.image.length > 0 || editorDraft.media.video.length > 0) ? (
                        <div className="flex flex-wrap gap-3 mt-3 border border-gray-300 p-3 rounded-lg w-full h-[100px] overflow-auto">
                            {editorDraft.media.image.map((image, index) => (
                                <div key={index} className="relative w-20 h-full">
                                    <div
                                        title={`Remove - (${image.name})`}
                                        className="absolute right-0 top-0 bg-red-500 hover:bg-red-400 cursor-pointer rounded-full p-1 z-10"
                                        onClick={() => handleRemoveMedia("image", index)} >
                                        <FaMinus className="w-[10px] h-[10px]" />
                                    </div>
                                    <img
                                        src={URL.createObjectURL(image)}
                                        alt={`Selected Image ${index + 1}`}
                                        className="w-full h-full object-cover rounded-md border border-gray-300 select-none"
                                        draggable="false"
                                    />
                                </div>
                            ))}
                            {editorDraft.media.video.map((video, index) => (
                                <div key={index} className="relative w-20 h-full">
                                    <div
                                        title={`Remove - (${video.name})`}
                                        className="absolute right-0 top-0 bg-red-500 hover:bg-red-400 cursor-pointer rounded-full p-1 z-10"
                                        onClick={() => handleRemoveMedia("video", index)} >
                                        <FaMinus className="w-[10px] h-[10px]" />
                                    </div>
                                    <video
                                        src={URL.createObjectURL(video)}
                                        controls
                                        className="w-full h-full object-cover rounded-md border border-gray-300 select-none"
                                        draggable="false"
                                    />
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {/* Error Label */}
                    {inputError.media && <span className="text-red-500 text-sm">{inputError.media}</span>}
                </div>
                {/* Action Buttons */}
                <div className="flex items-center justify-end w-full mt-5 gap-3">
                    <PrimaryButton text="Submit" onClick={handlePostSubmission} disabled={!editorDraft} />
                    <SecondaryButton onClick={() => setShowAddPanel(false)} text="Cancel" />
                </div>
            </div>

        </div>
    )
}

export default AddPostOverlay;