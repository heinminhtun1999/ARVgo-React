// React Router Dom
import { useNavigate } from "react-router-dom";


// React Icons
import { FaSortAmountDown } from "react-icons/fa";
import { FaSortAmountUp } from "react-icons/fa";
import { MdDeleteForever } from "react-icons/md";

function Table({ data, orderBy, columns, state, navigateRoute, setFilter }) {

    const navigate = useNavigate();

    // Empty Data Handling
    if (data.length == 0) return (
        <div className="flex items-center justify-center h-full">
            <p className="text-center font-bold text-4xl text-gray-600/30">No data available</p>
        </div>);

    // Sorting
    function handleSorting(columnName) {
        const currentOrder = orderBy.field;
        if (columnName === currentOrder) {
            setFilter(prev => (
                {
                    ...prev,
                    orderBy: {
                        field: columnName,
                        order: prev.orderBy.order === "ASC" ? "DESC" : "ASC"
                    }
                }
            ))
        } else {
            setFilter(prev => (
                {
                    ...prev,
                    orderBy: {
                        field: columnName,
                        order: "DSC"
                    }
                }
            ))
        }
    }

    // Dynamic column creation
    const columnNameElements = columns.filter(c => c !== "id").map((c, i) => {
        let columnName = c.split("_");
        columnName = columnName.map(word => word[0].toUpperCase() + word.slice(1)).join(" ");
        return (
            <th
                key={i}
                className="px-3 py-5 cursor-pointer text-white bg-primary-green-300 hover:bg-primary-green-200 m-0 text-start border-x-1 border-primary-green-300"
                onClick={() => handleSorting(c)}
            >
                <div className="flex items-center gap-3">
                    <span>{columnName}</span>
                    {
                        orderBy.field == c &&
                        (orderBy.order == "ASC" ? <FaSortAmountUp /> : <FaSortAmountDown />)
                    }
                </div>
            </th>
        )
    });

    // Data Elements
    const dataElements = data.map((d, i) => {
        return (

            <tr key={i}
                className={`cursor-pointer text-gray-700 font-semibold border-b-1 border-gray-200 last:border-b-0 hover:bg-primary-green-50 even:bg-gray-50 border-x-1 select-none`}
                onClick={() => navigate(`${navigateRoute}/${d.id}`, { state: JSON.stringify(state) })}>
                {
                    columns.map((c, c_i) => {
                        return (
                            <td className="h-[30px] w-[300px] px-3 py-5" key={c_i}>{c.includes("date") ? d[c].split("T")[0] : d[c]}</td>
                        )
                    })
                }
                <td className="w-[30px] px-3 py-5" onClick={(e) => e.stopPropagation()}><MdDeleteForever className="text-xl text-red-500 hover:text-red-400 m-auto" /></td>
            </tr>
        )
    });

    return (
        <div className="w-full min-h-max overflow-auto py-2">
            <table className="min-w-full w-max table-fixed shadow">
                <thead>
                    <tr>
                        {columnNameElements}
                        <th className="px-3 py-5 cursor-pointer text-white text-center bg-primary-green-300 hover:bg-primary-green-200 m-0 border-x-1 border-primary-green-300">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {dataElements}
                </tbody>
            </table>
        </div>
    )
}

export default Table