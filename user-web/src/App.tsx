import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RegisterShop from './pages/RegisterShop';
import PostDetail from './pages/PostDetail';
import MyPosts from './pages/MyPosts';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/detail/:slug" element={<PostDetail />} />
          <Route path="/register-shop" element={<RegisterShop />} />
          <Route path="/my-posts" element={<MyPosts />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
