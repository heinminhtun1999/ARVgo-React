// React 
import { useEffect, useState } from 'react';

// Rich Text Editor Component for Adding Posts
import Quill from 'quill';
import "quill/dist/quill.snow.css";

// Components
import PrimaryButton from './Buttons/PrimaryButton.jsx';
import SecondaryButton from './Buttons/SecondaryButton.jsx';

// API
import { createPost } from '../../api/posts.js';

const toolbarOptions = [
    [{ font: [] }, { size: [] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5] }],
    ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }, 'link', 'blockquote', { 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],// toggled buttons
    [{ color: [] }, { align: [] }], // dropdown with defaults from theme,
    ['clean'], // remove formatting button
];

function AddPostOverlay({ setShowAddPanel, editorDraft, setEditorDraft }) {

    const [quill, setQuill] = useState(null);
    const [inputError, setInputError] = useState({ title: "", content: "", eventDate: "", media: "" });

    useEffect(() => {

        // Check if Quill editor is already initialized to prevent multiple instances
        if (document.querySelector('.ql-toolbar')) {
            const toolbar = document.querySelector('.ql-toolbar');
            toolbar.classList.add('w-full')
            return;
        };

        //  Quill Editor Options
        const options = {
            placeholder: 'Compose an epic...',
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions,
            }
        };

        // Initialize Quill editor
        const quill = new Quill('#editor', options)

        setQuill(quill); // Set the quill instance in state

        // Set initial content if editorDraft is provided
        if (editorDraft) {
            quill.root.innerHTML = editorDraft.content;
        }

        quill.on('text-change', function () {
            // Handle text change event
            setEditorDraft(prev => ({
                ...prev,
                content: quill.getSemanticHTML().trim()
            }));
        });
    }, [])


    // Handle Title and Date Change
    const handleTitleChange = (e) => {
        const title = e.target.value;
        setEditorDraft(prev => ({
            ...prev,
            title: title
        }));
    }

    const handleDateChange = (e) => {
        const eventDate = e.target.value;
        setEditorDraft(prev => ({
            ...prev,
            eventDate: eventDate
        }));
    }

    // Handle File Change
    const fileChangeHandler = (e) => {
        const files = e.target.files;
        const fileArray = Array.from(files);

        if (fileArray.length === 0) return;

        // Check for file size limit (20MB)
        const validFiles = [];
        const invalidFiles = [];

        fileArray.forEach((file, i) => {
            if (file.size <= 20 * 1024 * 1024) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        })

        // Update input error with message
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

    // Handle Post Submission
    const handlePostSubmission = async () => {
        console.log("Submitting post with data:", editorDraft);
        const response = await createPost({ data: editorDraft });

        if (!response) console.error("Failed to create post");

        const status = response.status;

        // Check if the response is successful
        if (status === 200) {
            console.log("Post created successfully:", response);
            setShowAddPanel(false); // Close the overlay after successful post creation
            setEditorDraft(""); // Clear the editor draft state
        } else {
            console.error("Failed to create post:", response);
        }
    }


    return (
        <div className="fixed top-0 left-0 w-lvw h-lvh bg-black/50 z-30 flex items-center justify-center p-10">
            <div className="w-1/2 h-full bg-white rounded-lg shadow-lg flex flex-col items-center p-5 overflow-auto">
                <h2 className="text-3xl font-bold mb-10 text-gray-700">Add New Post</h2>

                {/* Title Input */}
                <input type="text" className="w-full p-2 border-b border-gray-300 mb-5 focus:outline-none focus:border-primary-green-400"
                    placeholder="Post Title"
                    onChange={handleTitleChange}
                    value={editorDraft.title}
                    required
                />

                {/* Date Picker */}
                <div className="flex items-center justify-start w-full mb-5 gap-3">
                    <label className="text-gray-700 font-bold text-md text-nowrap ">Event Date:</label>
                    <input type="date" className="w-full p-2 text-gray-700 border-b border-gray-300 mb-5 focus:outline-none focus:border-primary-green-400"
                        placeholder="Event Date"
                        onChange={handleDateChange}
                        value={editorDraft.eventDate}
                        max={new Date().toISOString().split("T")[0]}
                    />
                </div>

                {/* Quill Editor */}
                <div id="editor" className="w-full h-full border border-gray-300 overflow-hidden min-h-[300px]" >
                </div>

                {/* File Input */}
                <div className="mt-5 w-full">
                    <div className="flex items-center justify-start  mt-5 gap-3">
                        <label className="text-gray-700 font-bold text-md text-nowrap">Media:</label>
                        <input type="file" className="w-full p-2 text-gray-700 border border-gray-300 mb-5 focus:outline-none focus:border-primary-green-400"
                            accept=".jpg, .jpeg, .png, .gif, .mp4, .webm"
                            multiple
                            onChange={fileChangeHandler}
                        />
                    </div>
                    <span className="text-red-500 text-sm">{inputError.media}</span>
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