// React 
import { useEffect } from 'react';

// Rich Text Editor Component for Adding Posts
import Quill from 'quill';
import "quill/dist/quill.snow.css";

const toolbarOptions = [
    [{ font: [] }, { size: [] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5] }],
    ['bold', 'italic', 'underline', 'strike', { script: 'sub' }, { script: 'super' }, 'link', 'blockquote', { 'list': 'ordered' }, { 'list': 'bullet' }, { 'list': 'check' }],// toggled buttons
    [{ color: [] }, { align: [] }], // dropdown with defaults from theme,
    ['clean'], // remove formatting button
];

function QuillEditor({ editorDraft, setEditorDraft }) {

    useEffect(() => {

        // Check if Quill editor is already initialized to prevent multiple instances
        if (document.querySelector('.ql-toolbar')) {
            const toolbar = document.querySelector('.ql-toolbar');
            toolbar.classList.add('w-full')
            return;
        };

        //  Quill Editor Options
        const options = {
            placeholder: '',
            theme: 'snow',
            modules: {
                toolbar: toolbarOptions,
            }
        };

        // Initialize Quill editor
        const quill = new Quill('#editor', options)

        // Set initial content if editorDraft is provided
        if (editorDraft) {
            quill.root.innerHTML = editorDraft.content;
        }

        // Handle text change event
        quill.on('text-change', function () {
            // Update editorDraft state with the current content
            setEditorDraft(prev => ({
                ...prev,
                content: quill.getContents().ops[0].insert == "\n" ? "" : quill.getSemanticHTML().trim()
            }));
        });

    }, []);

    return (
        <div id="editor" className="w-full !h-[300px] overflow-y-auto border border-gray-300 z-0">
        </div>
    )
}

export default QuillEditor;