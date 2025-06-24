import { useState } from 'react'
import './App.css'
import { Routes, Route } from "react-router";

import AdminPage from './routes/AdminPage.jsx'
import DashBoardHome from './pages/dashboard/DashboardHome.jsx'
import DashBoardPosts from './pages/dashboard/DashBoardPosts.jsx'
import DashBoardMedia from './pages/dashboard/DashBoardMedia.jsx'
import NotFound from './routes/NotFound.jsx'

function App() {

    return (
        <Routes>
            {/*<Route index element={<LandingPage />} />*/}
            <Route path="/admin" element={<AdminPage />}>
                <Route index path="home" element={<DashBoardHome />} />
                <Route path="posts" element={<DashBoardPosts />} />
                <Route path="media" element={<DashBoardMedia />} />
            </Route>
            {/*<Route index path="/admin" element={<AdminPage />} />*/}

            <Route path="*" element={<NotFound />}></Route>
        </Routes>
    )
}

export default App
