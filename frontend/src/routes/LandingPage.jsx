import {Outlet} from "react-router";
import Logo from "../assets/images/ARV Logo.png"

// Components
import Header from "../components/landing/Header.jsx";

import { FaBeer } from 'react-icons/fa';

function LandingPage() {
    return (
        <div className="w-lvw h-lvh 0">
            <Header />
            <Outlet />
        </div>
    )
}

export default LandingPage;