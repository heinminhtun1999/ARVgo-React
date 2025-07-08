// React
import { useState, useEffect } from "react";

// Component
import AddButton from '../../components/dashboard/Buttons/AddButton.jsx';
import AddPostOverlay from '../../components/dashboard/AddPostOverlay.jsx';
import ErrorAlert from '../../components/dashboard/ErrorAlert.jsx';
import Table from '../../components/dashboard/Table.jsx';
import DatePicker from '../../components/dashboard/DatePicker.jsx';
import FilterPanel from '../../components/dashboard/FilterPanel.jsx';
import Loading from '../../components/dashboard/Loading.jsx';
import { MdArrowBackIos } from "react-icons/md";
import { MdArrowForwardIos } from "react-icons/md";

// API
import { getAllPosts } from "../../api/posts.js";

function DashboardPosts() {

    const [showAddOverlay, setShowAddOverlay] = useState(false);
    const [editorDraft, setEditorDraft] = useState({ title: "", content: "", media: { image: [], video: [] }, eventDate: "", album: "" });
    const [loading, setLoading] = useState(false);
    const [posts, setPosts] = useState({ posts: [], fetchedLength: 0 });
    const [columns, setColumns] = useState([]);
    const [error, setError] = useState(null);
    const [postsPerPage, setPostsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [offset, setOffset] = useState(postsPerPage * (currentPage - 1));
    const [filter, setFilter] = useState({ searchKeyword: "", eventDate: "", startDate: "", endDate: "" });
    const [orderBy, setOrderBy] = useState({ field: "uploaded_date", order: "DESC" });


    useEffect(() => {

        // Fetch Posts
        async function fetchPosts() {
            setLoading(true);
            const offset = (currentPage - 1) * postsPerPage;
            setOffset(offset);
            const limit = postsPerPage;
            try {
                const posts = await getAllPosts({ orderBy: JSON.stringify(orderBy), offset, limit, ...filter });
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
        }

        if (!showAddOverlay) fetchPosts();

    }, [postsPerPage, currentPage, showAddOverlay, filter, orderBy]);

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
        setFilter(prev => ({ ...prev, searchKeyword: value }));
    }

    // Handle Page Changes
    function handlePreviousPage() {
        setCurrentPage(currentPage - 1);
    }

    function handleNextPage() {
        setCurrentPage(currentPage + 1);
    }

    // Generate Page Indicators
    function createPageIndicators(n) {
        const pageIndicators = [];
        const totalPages = Math.ceil(n / postsPerPage);

        // If there are more than 10 pages, add ellipsis or else add all page indicators

        // Define Page Start and End
        let start = Math.max(currentPage - 2, 1);
        let end = Math.min(currentPage + 2, totalPages);

        // Centering the active tab
        if (currentPage <= 3) {
            end = Math.min(5, totalPages);
        }
        if (currentPage >= totalPages - 2) {
            start = Math.max(totalPages - 4, 1);
        }

        // Adding Ellipsis
        if (start > 1) {
            pageIndicators.push(
                <span
                    key={totalPages + 1}
                    className="py-2 md:px-3 w-full text-center cursor-pointer text-gray-700"
                    onClick={() => setCurrentPage(1)}>
                    1
                </span>);
            pageIndicators.push(
                <span
                    key={totalPages + 2}
                    className="py-2 md:px-3 w-full text-center cursor-pointer text-gray-700">...</span>);
        }

        // Adding Page Indicators
        for (let i = start; i <= end; i++) {
            pageIndicators.push(
                <span
                    key={i}
                    className={`py-2 md:px-3 w-full text-center cursor-pointer text-gray-700 hover:bg-primary-green-200 hover:text-white rounded-sm ${i === currentPage ? 'bg-primary-green-200 text-white ' : ''}`}
                    onClick={() => setCurrentPage(i)}>
                    {i}
                </span>);
        }

        // Adding Ellipsis
        if (end < totalPages) {
            pageIndicators.push(<span
                key={totalPages + 3}
                className="py-2 md:px-3 w-full text-center cursor-pointer text-gray-700">...</span>);
            pageIndicators.push(
                <span
                    key={totalPages + 4}
                    className="py-2 md:px-3 w-full text-center cursor-pointer text-gray-700"
                    onClick={() => setCurrentPage(totalPages)}>
                    {totalPages}
                </span>);
        }

        return pageIndicators;
    }

    return (

        <div className="w-full h-full">
            {/* Error Box */}
            {
                error && <ErrorAlert error={error} setError={setError} />
            }

            {
                loading &&
                (
                    // Loading Indicator
                    <Loading />
                )

            }

            {/* // Dashboard */}
            <div className="flex flex-col items-center justify-start flex-nowrap w-full h-full gap-5">

                {/* Filters */}
                <div className="flex items-center w-full text-gray-500 gap-5">
                    {/* Posts per page */}
                    <div>
                        <label>Posts per page: </label>
                        <select id="postsPerPage" className="p-2 border-b border-gray-300 focus:outline-none focus:border-primary-green-400" value={postsPerPage} onChange={(e) => setPostsPerPage(e.target.value)}>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                        </select>
                    </div>
                    <div>{offset + posts.posts.length} of {posts.fetchedLength}</div>
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

                {/* Table */}
                <Table
                    data={posts.posts}
                    orderBy={orderBy}
                    setOrderBy={setOrderBy}
                    columns={columns}
                    state={{ orderBy: JSON.stringify(orderBy), offset, limit: postsPerPage, ...filter }}
                    navigateRoute="/admin/posts"
                />

                {/* Pagination */}
                {
                    posts.fetchedLength > 0 && (
                        <div className="flex items-center justify-center shadow-sm bg-white rounded-2xl p-2 gap-1 w-full md:w-max">
                            <button className="p-2 cursor-pointer disabled:cursor-default" disabled={currentPage === 1} onClick={handlePreviousPage}><MdArrowBackIos className="w-5 h-5" /></button>
                            {createPageIndicators(posts.fetchedLength)}
                            <button className="p-2 cursor-pointer disabled:cursor-default" disabled={currentPage === Math.ceil(posts.fetchedLength / postsPerPage)} onClick={handleNextPage}><MdArrowForwardIos className="w-5 h-5" /></button>
                        </div>
                    )
                }
            </div>



            {/* Add New Post */}
            <AddButton onClick={() => { setShowAddOverlay(!showAddOverlay) }} />
            {
                showAddOverlay && (
                    <AddPostOverlay setShowAddPanel={setShowAddOverlay} editorDraft={editorDraft} setEditorDraft={setEditorDraft} />
                )
            }
        </div >
    )
}

export default DashboardPosts;