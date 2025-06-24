import { IoAddOutline } from "react-icons/io5";

function AddButton({ onClick }) {
    return (
        <button className="fixed right-10 bottom-10 bg-primary-green-500 text-white p-2 rounded-full cursor-pointer hover:bg-primary-green-300 z-20" title="Add" onClick={onClick}>
            <IoAddOutline className="w-10 h-10" />
        </button>
    )
}

export default AddButton;