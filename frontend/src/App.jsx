import './App.css'
import { Routes, Route } from "react-router-dom";

import AdminPage from './routes/AdminPage.jsx'
import DashboardHome from './pages/dashboard/DashboardHome.jsx'
import DashboardPosts from './pages/dashboard/DashboardPosts.jsx'
import DashboardMedia from './pages/dashboard/DashboardMedia.jsx'
import Post from './pages/dashboard/Post.jsx'
import NotFound from './routes/NotFound.jsx'

function App() {

    return (
        <Routes>
            {/*<Route index element={<LandingPage />} />*/}
            <Route path="/admin" element={<AdminPage />}>
                <Route index path="home" element={<DashboardHome />} />
                <Route path="posts" element={<DashboardPosts />} />
                <Route path="posts/:post_id" element={<Post />} />
                <Route path="media" element={<DashboardMedia />} />
            </Route>
            {/*<Route index path="/admin" element={<AdminPage />} />*/}

            <Route path="*" element={<NotFound />}></Route>
        </Routes>
    )
}

export default App
