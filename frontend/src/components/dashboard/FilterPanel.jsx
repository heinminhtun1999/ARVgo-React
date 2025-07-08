import { useState } from "react";

import { MdFilterListAlt } from "react-icons/md";

function FilterPanel({ children, className }) {

    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`${className}`}>
            {
                isOpen && <div className="fixed w-screen h-screen z-10 top-0 left-0" onClick={() => setIsOpen(false)}></div>
            }
            <div className="relative z-30">
                <div className="shadow-md p-2 rounded-md bg-white flex items-center justify-center cursor-pointer hover:bg-gray-100/50" title="filter" onClick={() => setIsOpen(!isOpen)}>
                    <MdFilterListAlt className="text-xl text-primary-green-300" />
                </div>
                {
                    isOpen &&
                    (
                        <div className="shadow-sm min-w-[300px] rounded-md bg-white absolute top-[110%] right-0 p-5 flex flex-col gap-3 select-none"
                            style={{ animation: 'fadeIn 0.1s linear' }}>
                            {children}
                        </div>
                    )
                }
            </div>
        </div>
    )
}

export default FilterPanel;