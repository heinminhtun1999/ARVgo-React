import { IoClose } from "react-icons/io5";

import { useEffect } from 'react';

function ErrorAlert({ error, setError }) {

    useEffect(() => {
        const timeout = setTimeout(() => {
            setError("");
        }, 5000);
        return () => clearTimeout(timeout); // cleanup function to clear the timeout on component unmount
    }, []);

    return (
        <div className="bg-red-400 max-w-[300px] text-center fixed top-5 right-5 rounded-md text-white px-5 py-7 transform  opacity-0 transition-all duration-500 ease-out z-50"
            style={{ animation: 'slideIn 0.5s forwards' }}>
            <IoClose className="absolute top-2 right-2 cursor-pointer text-xl hover:text-gray-300"
                onClick={() => setError("")}
            />
            <p className="font-bold">{error}</p>
        </div>
    )
}

export default ErrorAlert;