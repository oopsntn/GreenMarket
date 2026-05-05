import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import RegisterShop from './pages/RegisterShop';
import MyPosts from './pages/MyPosts';
import CreatePost from './pages/CreatePost';
import PostDetail from './pages/PostDetail';
import Login from './pages/Login';
import NewsDetail from "./pages/NewsDetail";
import Profile from './pages/Profile';
import ShopDetail from './pages/ShopDetail';
import ShopList from './pages/ShopList';
import PaymentResult from './pages/PaymentResult';
import SavedPosts from './pages/SavedPosts';
import Splash from './pages/Splash';
import OwnerDashboard from './pages/OwnerDashboard';
import Packages from './pages/Packages';
import PersonalDashboard from './pages/PersonalDashboard';
import ScrollToTop from './components/ScrollToTop';
import News from './pages/News';
import NewsBookmarks from './pages/NewsBookmarks';
import CollaboratorDirectory from './pages/CollaboratorDirectory';
import CollaboratorInvitations from './pages/CollaboratorInvitations';
import ShopTeamManagement from './pages/ShopTeamManagement';
import CollaboratorPostPreview from './pages/CollaboratorPostPreview';
import { Toaster } from 'react-hot-toast';

/**
 * AppContent handles the conditional rendering of the Navbar
 * because useLocation() must be used inside a <Router> component.
 */
const AppContent: React.FC = () => {
  const location = useLocation();
  const isSplash = location.pathname === '/';

  return (
    <div className="min-h-screen">
      {!isSplash && <Navbar />}
      <Routes>
        <Route path="/" element={<Splash />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/shops" element={<ShopList />} />
        <Route path="/news" element={<News />} />
        <Route path="/news/detail/:id" element={<NewsDetail />} />
        <Route path="/packages" element={<Packages />} />
        <Route path="/payment-result" element={<PaymentResult />} />
        <Route path="/posts/detail/:slug" element={<PostDetail />} />
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
        <Route path="/owner-dashboard" element={
          <ProtectedRoute>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/personal-dashboard" element={
          <ProtectedRoute>
            <PersonalDashboard />
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
        <Route path="/news/bookmarks" element={
          <ProtectedRoute>
            <NewsBookmarks />
          </ProtectedRoute>
        } />
        <Route path="/collaborator/directory" element={
          <ProtectedRoute>
            <CollaboratorDirectory />
          </ProtectedRoute>
        } />
        <Route path="/collaborator/invitations" element={
          <ProtectedRoute>
            <CollaboratorInvitations />
          </ProtectedRoute>
        } />
        <Route path="/owner-dashboard/team" element={
          <ProtectedRoute>
            <ShopTeamManagement />
          </ProtectedRoute>
        } />
        <Route path="/owner-dashboard/pending-posts/:id" element={
          <ProtectedRoute>
            <CollaboratorPostPreview />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Toaster position="top-right" />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
