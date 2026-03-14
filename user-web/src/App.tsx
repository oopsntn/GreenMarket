import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import RegisterShop from './pages/RegisterShop';
import PostDetail from './pages/PostDetail';
import MyPosts from './pages/MyPosts';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/detail/:slug" element={<PostDetail />} />

            {/* Protected Routes */}
            <Route path="/register-shop" element={
              <ProtectedRoute>
                <RegisterShop />
              </ProtectedRoute>
            } />
            <Route path="/my-posts" element={
              <ProtectedRoute>
                <MyPosts />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
