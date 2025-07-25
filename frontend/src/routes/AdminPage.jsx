// Components
import Navpanel from "../components/dashboard/NavPanel.jsx";

// React
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

// Icons & Logo
import { GiHamburgerMenu } from "react-icons/gi";
import ARVgoLogo2 from "../assets/images/ARgo Logo.png";

function AdminPage() {

    const screenWidth = screen.width;

    const [expanded, setExpanded] = useState(screenWidth < 768 ? false : true);

    const location = useLocation();
    let pathname = location.pathname.split("/")[2];

    return (
        <div className="max-w-screen min-h-screen grid grid-rows-[auto_1fr] md:grid-cols-[auto_1fr]">
            <Navpanel expanded={expanded} setExpanded={setExpanded} />
            {/*Header Outer Div*/}
            <header className="w-full h-[80px] p-2 pb-0">
                {/*Inner Section*/}
                <div className="w-full h-full rounded-lg shadow-sm bg-white px-5 py-4 flex items-center gap-3">
                    {/*Hamburger Icon*/}
                    <GiHamburgerMenu className="hover:cursor-pointer md:hidden block" onClick={() => setExpanded(!expanded)} />
                    {/*Logo*/}
                    <a href="/admin/home" className="h-full overflow-hidden md:hidden block">
                        <img src={ARVgoLogo2} alt="arvgoLogo" className="w-full h-full overflow-hidden" />
                    </a>
                    {/*Current pathname*/}
                    <h2 className="ms-auto md:ms-0 font-bold text-neutral-500">{pathname ? pathname.toUpperCase() : "Home"}</h2>
                </div>
            </header>
            {/*Main Outer Div*/}
            <main className="w-full h-full p-2 overflow-y-hidden">
                {/*Inner Section*/}
                <div className="w-full h-full rounded-lg shadow-sm bg-white px-5 py-4 ">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}

export default AdminPage;