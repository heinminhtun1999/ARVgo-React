// React
import { useState } from "react";

// Component
import AddButton from '../../components/dashboard/Buttons/AddButton.jsx';
import AddPostOverlay from '../../components/dashboard/AddPostOverlay.jsx';

function DashboardPosts() {

    const [showAddOverlay, setShowAddOverlay] = useState(true);
    const [editorDraft, setEditorDraft] = useState({ title: "", content: "", media: { image: [], video: [] }, eventDate: "" });

    return (

        <div>
            <AddButton onClick={() => { setShowAddOverlay(!showAddOverlay) }} />

            {showAddOverlay && (
                <AddPostOverlay setShowAddPanel={setShowAddOverlay} editorDraft={editorDraft} setEditorDraft={setEditorDraft} />
            )}
        </div>
    )
}

export default DashboardPosts;