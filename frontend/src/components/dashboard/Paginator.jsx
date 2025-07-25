function Paginator({ n, currentPage, postsPerPage, setCurrentPage }) {
    const pageIndicators = [];
    const totalPages = Math.ceil(n / postsPerPage);

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


export default Paginator;