import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import RegisterShop from './pages/RegisterShop';
import MyPosts from './pages/MyPosts';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ShopDetail from './pages/ShopDetail';
import ShopList from './pages/ShopList';
import PaymentResult from './pages/PaymentResult';
import SavedPosts from './pages/SavedPosts';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <div className="min-h-screen">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/shops" element={<ShopList />} />
            <Route path="/payment-result" element={<PaymentResult />} />
            <Route path="/detail/:slug" element={<PostDetail />} />
            <Route path="/shop/:id" element={<ShopDetail />} />

            {/* Protected Routes */}
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
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
            <Route path="/create-post" element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            } />
            <Route path="/saved-posts" element={
              <ProtectedRoute>
                <SavedPosts />
              </ProtectedRoute>
            } />
            <Route path="/posts/detail/:slug" element={<PostDetail />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
