// React
import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";

// Component
import AddButton from '../../components/dashboard/Buttons/AddButton.jsx';
import AddPostOverlay from '../../components/dashboard/AddPostOverlay.jsx';
import ErrorAlert from '../../components/dashboard/ErrorAlert.jsx';
import SuccessAlert from '../../components/dashboard/SuccessAlert.jsx';
import Table from '../../components/dashboard/Table.jsx';
import DatePicker from '../../components/dashboard/DatePicker.jsx';
import FilterPanel from '../../components/dashboard/FilterPanel.jsx';
import Loading from '../../components/dashboard/Loading.jsx';
import Paginator from '../../components/dashboard/Paginator.jsx';
import { MdArrowBackIos } from "react-icons/md";
import { MdArrowForwardIos } from "react-icons/md";

// API
import { getAllPosts } from "../../api/posts.js";

// Utils
import { debounce } from '../../utils/utils.js';

function DashboardPosts() {

    const location = useLocation();
    const state = JSON.parse(location.state);

    const [showAddOverlay, setShowAddOverlay] = useState(false);
    const [editorDraft, setEditorDraft] = useState({ title: "", content: "", media: { image: [], video: [] }, eventDate: "", album: "" });
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState({ posts: [], fetchedLength: 0 });
    const [columns, setColumns] = useState([]);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [filter, setFilter] = useState(state ? state : {
        searchKeyword: "",
        eventDate: "",
        startDate: "",
        endDate: "",
        orderBy: { field: "uploaded_date", order: "DESC" },
        currentPage: 1,
        postsPerPage: 10
    });

    // Fetch Posts
    const fetchPosts = useCallback(async () => {
        setLoading(true);
        const offset = (filter.currentPage - 1) * filter.postsPerPage;
        const limit = filter.postsPerPage;
        try {
            const posts = await getAllPosts({ offset, limit, ...filter, orderBy: JSON.stringify(filter.orderBy) });
            setPosts(posts.data.data);
            // Separate Columns
            if (posts.data.data.fetchedLength > 0) {
                const columnNames = Object.keys(posts.data.data.posts[0]).filter(c => c !== "id");
                setColumns(columnNames)
            }
        } catch (error) {
            console.error(error)
            setError("Failed to fetch posts. Please try again. Check console for more details.");
        }
        setLoading(false);
    }, [filter]);

    // Debounce Fetch Posts (To avoid too many requests)
    const debouncedFetchPosts = useMemo(() => debounce(fetchPosts, 500), [fetchPosts]);

    useEffect(() => {

        debouncedFetchPosts();

    }, [debouncedFetchPosts]);

    // Handle Date Filter Chagne
    function handleEventDateChange(e) {
        e.preventDefault();
        const value = e.target.value;
        setFilter(prev => ({ ...prev, eventDate: value }));
    }

    function handleStartDateChange(e) {
        e.preventDefault();
        const value = e.target.value;
        setFilter(prev => ({ ...prev, startDate: value }));
    }

    function handleEndDateChange(e) {
        e.preventDefault();
        const value = e.target.value;
        setFilter(prev => ({ ...prev, endDate: value }));
    }

    // Handle Search
    function handleSearch(e) {
        const value = e.target.value;
        setFilter(prev => ({ ...prev, searchKeyword: value, currentPage: 1 }));
    }

    // Handle Page Changes
    function setCurrentPage(page) {
        setFilter(prev => (
            {
                ...prev,
                currentPage: page,
            }
        ));
    }


    function handlePreviousPage() {
        setCurrentPage(Math.max(filter.currentPage - 1, 1));
    }

    function handleNextPage() {
        const max = Math.ceil(posts.fetchedLength / filter.postsPerPage);
        setCurrentPage(Math.min(filter.currentPage + 1, max));
    }



    return (

        <div className="w-full h-full">

            {/* Error Box */}
            {
                error && <ErrorAlert error={error} setError={setError} />
            }

            {/* Success Box */}
            {
                successMessage && <SuccessAlert successMessage={successMessage} setSuccessMessage={setSuccessMessage} />
            }

            {/* Filters */}
            <div className="flex items-center w-full text-gray-500 gap-5">
                {/* Posts per page */}
                <div>
                    <label>Posts per page: </label>
                    <select id="postsPerPage" className="p-2 border-b border-gray-300 focus:outline-none focus:border-primary-green-400"
                        value={filter.postsPerPage} onChange={(e) => setFilter(prev => ({ ...prev, postsPerPage: e.target.value }))}>
                        <option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                    </select>
                </div>
                <div>{((filter.currentPage - 1) * filter.postsPerPage) + posts.posts.length} of {posts.fetchedLength}</div>
                <FilterPanel className="ml-auto">
                    {/* Search */}
                    <input
                        type="text"
                        placeholder="Search By Title or Album"
                        className="p-2 border-1 rounded-md border-gray-300  focus:outline-none focus:border-primary-green-400 w-full"
                        onChange={handleSearch}
                    />
                    {/* Date Picker */}
                    <div>
                        <label htmlFor="eventDate">Event Date: </label>
                        <DatePicker id="eventDate" value={filter.eventDate} handleDateChange={handleEventDateChange} />
                    </div>
                    <div>
                        <label htmlFor="startDate">Start Date: </label>
                        <DatePicker id="startDate" value={filter.startDate} handleDateChange={handleStartDateChange} max={filter.endDate ? filter.endDate : ''} />
                    </div>
                    <div>
                        <label htmlFor="endDate">End Date: </label>
                        <DatePicker id="endDate" value={filter.endDate} handleDateChange={handleEndDateChange} min={filter.startDate ? filter.startDate : ''} />
                    </div>
                </FilterPanel>

            </div>


            {/* Main Content */}
            {
                loading ?
                    (
                        // Loading Indicator
                        <Loading />
                    )
                    :
                    (
                        // Main Content
                        <div className="flex flex-col items-center justify-start flex-nowrap w-full h-full gap-5">

                            {/* Table */}
                            <Table
                                data={posts.posts}
                                orderBy={filter.orderBy}
                                setFilter={setFilter}
                                columns={columns}
                                state={{ ...filter, message: "" }}
                            />

                            {/* Pagination */}
                            {
                                posts.fetchedLength > 0 && (
                                    <div className="flex items-center justify-center shadow-sm bg-white rounded-2xl p-2 gap-1 w-full md:w-max">
                                        <button className="p-2 cursor-pointer disabled:cursor-default" disabled={filter.currentPage === 1} onClick={handlePreviousPage}><MdArrowBackIos className="w-5 h-5" /></button>

                                        {/* Generate Page Indicators */}
                                        <Paginator n={posts.fetchedLength} currentPage={filter.currentPage} postsPerPage={filter.postsPerPage} setCurrentPage={setCurrentPage} />
                                        <button className="p-2 cursor-pointer disabled:cursor-default" disabled={filter.currentPage === Math.ceil(posts.fetchedLength / filter.postsPerPage)} onClick={handleNextPage}><MdArrowForwardIos className="w-5 h-5" /></button>
                                    </div>
                                )
                            }
                        </div>




                    )

            }

            {/* Add New Post */}
            <AddButton onClick={() => { setShowAddOverlay(!showAddOverlay) }} />
            {
                showAddOverlay && (
                    <AddPostOverlay setShowAddPanel={setShowAddOverlay} editorDraft={editorDraft} setEditorDraft={setEditorDraft} setError={setError} state={{ ...filter }} />
                )
            }
        </div >
    )
}

export default DashboardPosts;