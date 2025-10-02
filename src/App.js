import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { AuthProvider, PrivateRoute } from './components/AuthProvider';
import Navbar from './components/Navbar';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import PostFeed from './features/posts/PostFeed';
import Profile from './features/profile/Profile';
import JobBoard from './features/jobs/JobBoard';
import UserDashboard from './features/dashboard/UserDashboard';
import AdvancedSearch from './features/search/AdvancedSearch';
import ProfessionalDevelopment from './features/developement/ProfessionalDevelopment';
import NotificationsPage from './features/notifications/NotificationsPage';
import ChatSystem from './features/messeging/ChatSystem'; 
import Network from './features/network/Network'; 
import EventsG from './features/events/EventsG';
import { Box } from '@mui/material';

// Placeholder components for missing features
/*const Messages = () => <div>Messages - Coming Soon</div>;
const Events = () => <div>Events - Coming Soon</div>;
const Notifications = () => <div>Notifications - Coming Soon</div>;
const Network = () => <div>Network - Coming Soon</div>;*/

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <Box sx={{ flexGrow: 1 }}>
            <Navbar />
            <Routes>
              <Route path="/" element={<Navigate to="/feed" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Protected Routes */}
              <Route path="/feed" element={<PrivateRoute><PostFeed /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/jobs" element={<PrivateRoute><JobBoard /></PrivateRoute>} />
              <Route path="/dashboard" element={<PrivateRoute><UserDashboard /></PrivateRoute>} />
              <Route path="/search" element={<PrivateRoute><AdvancedSearch /></PrivateRoute>} />
              <Route path="/developement" element={<PrivateRoute><ProfessionalDevelopment /></PrivateRoute>} />
              
              {/* Additional Routes */}
              <Route path="/messeging" element={<PrivateRoute><ChatSystem /></PrivateRoute>} />
              <Route path="/events" element={<PrivateRoute><EventsG /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
              <Route path="/network" element={<PrivateRoute><Network /></PrivateRoute>} />
              
              <Route path="*" element={<Navigate to="/feed" replace />} />
            </Routes>
          </Box>
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;