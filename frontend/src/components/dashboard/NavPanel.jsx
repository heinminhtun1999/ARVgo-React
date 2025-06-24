import { useLocation } from 'react-router';

import ARVgoLogo2 from "../../assets/images/ARV Logo 2.png"
import { MdHome } from "react-icons/md";
import { MdPermMedia } from "react-icons/md";
import { BsPostcardFill } from "react-icons/bs";
import { IoLogOut } from "react-icons/io5";
import { TbLayoutSidebarLeftExpandFilled } from "react-icons/tb";

function NavPanel({ expanded, setExpanded }) {

    const pages = ['Home', 'Posts', 'Media', 'Logout'];

    const getIcon = (page) => {
        switch (page) {
            case 'Home':
                return <MdHome className={expanded ? "ms-auto" : "m-auto"} />
            case 'Posts':
                return <BsPostcardFill className={expanded ? "ms-auto" : "m-auto"} />
            case 'Media':
                return <MdPermMedia className={expanded ? "ms-auto" : "m-auto"} />
            case 'Logout':
                return <IoLogOut className={expanded ? "ms-auto" : "m-auto"} />
            default:
                return
        }
    }

    const location = useLocation();
    const currentPage = location.pathname.split("/")[2]

    const navItems = pages.map((page, i) => {
        return <a key={i} href={`${page.toLowerCase()}`}
            className={"p-3 hover:bg-primary-green-100 hover:text-white w-full rounded-md text-center " +
                "grid grid-rows-1 items-center gap-2 "
                + (currentPage === page.toLowerCase() ? ' bg-primary-green-100 text-white ' : '') + (expanded ? "grid-cols-[30%_70%]" : "grid-cols-1")}>
            {getIcon(page)}
            {expanded ? <span className="text-start ">{page}</span> : null}
        </a>
    });

    return (
        // Outer Div
        <div
            className={"h-lvh p-2 pr-0 fixed transition-all duration-500 md:sticky md:top-0 text-neutral-500 row-span-2 " + (expanded ? 'left-0  w-[200px]' : '-left-full w-[90px]')}>
            {/*Inner Section*/}
            <div
                className={"w-full h-full overflow-x-hidden rounded-lg shadow-sm bg-white py-4 flex flex-col gap-5 items-center " + (expanded ? "px-5" : "px-3")}>
                {/*Logo*/}
                <a href="/admin/home" className="hidden md:block">
                    <img src={ARVgoLogo2} alt="arvgoLogo" />
                </a>
                <h1 className={"leading-tight font-bold " + (expanded ? "text-lg" : "text-xs")}>Dashboard</h1>
                {/*Nav Menu*/}
                <nav className="flex flex-col gap-3 items-center w-full">
                    {navItems}
                </nav>
                <div className="w-full mt-auto">
                    <TbLayoutSidebarLeftExpandFilled
                        className={"hover:cursor-pointer origin-center ms-auto " + (expanded ? "rotate-y-180" : "rotate-y-0")}
                        onClick={() => setExpanded(!expanded)} />
                </div>
            </div>
        </div>
    )
}

export default NavPanel;