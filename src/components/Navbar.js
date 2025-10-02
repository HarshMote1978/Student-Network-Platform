import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { useDispatch, useSelector } from 'react-redux';
import { auth } from '../services/firebase';
import { logout, selectUser } from '../features/auth/authslice'; 
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  Badge,
  Divider,
  alpha,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Home as HomeIcon,
  Work as WorkIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Event as EventIcon,
  Search as SearchIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  ExitToApp,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';

// Firestore imports for real-time data
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function Navbar() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [activePath, setActivePath] = useState('/');
  
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Track active path for highlighting
  useEffect(() => {
    setActivePath(location.pathname);
  }, [location]);

  // Real-time notifications count
  useEffect(() => {
    if (!user?.uid) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(notificationsQuery, 
      (snapshot) => {
        setNotificationsCount(snapshot.size);
      },
      (error) => {
        console.error('Error fetching notifications count:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Real-time unread messages count
  useEffect(() => {
    if (!user?.uid) return;

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, 
      (snapshot) => {
        let totalUnread = 0;
        
        // For each chat, count unread messages
        snapshot.docs.forEach(chatDoc => {
          const chatData = chatDoc.data();
          if (chatData.unreadCounts && chatData.unreadCounts[user.uid]) {
            totalUnread += chatData.unreadCounts[user.uid];
          }
        });
        
        setUnreadMessagesCount(totalUnread);
      },
      (error) => {
        console.error('Error fetching messages count:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(logout());
      navigate('/login');
      handleClose();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const isActivePath = (path) => {
    return activePath === path || activePath.startsWith(path + '/');
  };

  const NavigationIcon = ({ icon: Icon, label, path, count = 0, showBadge = false }) => (
    <Tooltip title={label} arrow>
      <IconButton 
        color="inherit" 
        component={Link} 
        to={path}
        sx={{ 
          flexDirection: 'column',
          minWidth: 80,
          borderRadius: 2,
          py: 1,
          mx: 0.5,
          backgroundColor: isActivePath(path) ? alpha('#fff', 0.15) : 'transparent',
          '&:hover': { 
            backgroundColor: alpha('#fff', 0.1),
            transform: 'translateY(-1px)'
          },
          transition: 'all 0.2s ease-in-out'
        }}
      >
        {showBadge ? (
          <Badge badgeContent={count} color="error" max={99}>
            <Icon />
          </Badge>
        ) : (
          <Icon />
        )}
        <Typography variant="caption" sx={{ 
          mt: 0.5, 
          fontSize: '0.7rem',
          fontWeight: isActivePath(path) ? 600 : 400
        }}>
          {label}
        </Typography>
      </IconButton>
    </Tooltip>
  );

  return (
    <AppBar 
      position="sticky" 
      sx={{ 
        mb: 3, 
        background: 'linear-gradient(135deg, #0a66c2 0%, #004182 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        backdropFilter: 'blur(10px)'
      }}
    >
      <Toolbar sx={{ 
        minHeight: { xs: '56px', md: '64px' },
        px: { xs: 1, md: 2 }
      }}>
        {/* Logo Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mr: { xs: 1, md: 3 },
          flexShrink: 0
        }}>
          <Typography 
            variant="h6" 
            component={Link} 
            to="/"
            sx={{ 
              fontWeight: 'bold',
              color: 'white', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              fontSize: { xs: '1.1rem', md: '1.25rem' }
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: { xs: 30, md: 36 },
                height: { xs: 30, md: 36 },
                borderRadius: 1.5,
                backgroundColor: 'white',
                color: '#0a66c2',
                fontWeight: 'bold',
                mr: 1.5,
                fontSize: { xs: '0.9rem', md: '1rem' },
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
              }}
            >
              SN
            </Box>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              Student Network
            </Box>
          </Typography>
        </Box>

        {user ? (
          <>
            {/* Search Bar - Desktop */}
            <Box 
              component="form" 
              onSubmit={handleSearch}
              sx={{ 
                flexGrow: 1, 
                maxWidth: 600, 
                mx: { xs: 1, md: 3 },
                display: { xs: 'none', md: 'block' } 
              }}
            >
              <TextField
                fullWidth
                size="small"
                placeholder="Search for jobs, people, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: 'grey.500' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    backgroundColor: 'white',
                    borderRadius: 3,
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    },
                    '&:hover': {
                      backgroundColor: alpha('#fff', 0.95),
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    },
                    '&.Mui-focused': {
                      backgroundColor: alpha('#fff', 0.95),
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }
                  }
                }}
              />
            </Box>

            {/* Navigation Icons - Desktop */}
            <Box sx={{ 
              display: { xs: 'none', md: 'flex' }, 
              alignItems: 'center',
              mr: 2
            }}>
              <NavigationIcon 
                icon={HomeIcon} 
                label="Home" 
                path="/feed" 
                active={isActivePath('/feed')}
              />
              
              <NavigationIcon 
                icon={PeopleIcon} 
                label="Network" 
                path="/network" 
                active={isActivePath('/network')}
              />
              
              <NavigationIcon 
                icon={WorkIcon} 
                label="Jobs" 
                path="/jobs" 
                active={isActivePath('/jobs')}
              />
              
              <NavigationIcon 
                icon={MessageIcon} 
                label="Messages" 
                path="/messeging" 
                count={unreadMessagesCount}
                showBadge={true}
                active={isActivePath('/messeging')}
              />
              
              <NavigationIcon 
                icon={NotificationsIcon} 
                label="Alerts" 
                path="/notifications" 
                count={notificationsCount}
                showBadge={true}
                active={isActivePath('/notifications')}
              />
              {/* Add this after the Notifications NavigationIcon */}
<NavigationIcon 
  icon={EventIcon} 
  label="EventsG" 
  path="/events" 
  active={isActivePath('/events')}
/>
            </Box>

            {/* Mobile Icons */}
            <Box sx={{ 
              display: { xs: 'flex', md: 'none' }, 
              alignItems: 'center',
              gap: 0.5,
              mr: 1
            }}>
              <IconButton 
                color="inherit" 
                component={Link} 
                to="/messeging"
                sx={{ 
                  position: 'relative',
                  borderRadius: 2
                }}
              >
                <Badge badgeContent={unreadMessagesCount} color="error" max={9}>
                  <MessageIcon />
                </Badge>
              </IconButton>
              
              <IconButton 
                color="inherit" 
                component={Link} 
                to="/notifications"
                sx={{ 
                  position: 'relative',
                  borderRadius: 2
                }}
              >
                <Badge badgeContent={notificationsCount} color="error" max={9}>
                  <NotificationsIcon />
                </Badge>
              </IconButton>
              
              <IconButton 
                color="inherit" 
                sx={{ 
                  borderRadius: 2,
                  display: { xs: 'flex', md: 'none' } 
                }}
                onClick={() => navigate('/search')}
              >
                <SearchIcon />
              </IconButton>
            </Box>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Tooltip title="Account menu" arrow>
                <IconButton 
                  onClick={handleMenu} 
                  color="inherit" 
                  sx={{ 
                    p: 0.5, 
                    ml: 0.5,
                    border: '2px solid transparent',
                    '&:hover': { 
                      borderColor: alpha('#fff', 0.3),
                      backgroundColor: alpha('#fff', 0.1)
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <Avatar 
                    src={user.photoURL} 
                    alt={user.displayName}
                    sx={{ 
                      width: { xs: 32, md: 36 }, 
                      height: { xs: 32, md: 36 },
                      border: `2px solid ${alpha('#fff', 0.2)}`
                    }}
                  />
                  {notificationsCount > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        width: 8,
                        height: 8,
                        backgroundColor: '#ff4757',
                        borderRadius: '50%',
                        border: `2px solid #0a66c2`
                      }}
                    />
                  )}
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 280,
                    maxWidth: 320,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                    borderRadius: 3,
                    overflow: 'visible',
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      backgroundColor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    }
                  }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                {/* User Info */}
                <MenuItem 
                  onClick={() => { navigate('/profile'); handleClose(); }}
                  sx={{ 
                    py: 2,
                    borderBottom: `1px solid ${alpha('#000', 0.1)}`
                  }}
                >
                  <Avatar 
                    src={user.photoURL} 
                    sx={{ 
                      width: 48, 
                      height: 48, 
                      mr: 2,
                      border: `2px solid ${alpha('#0a66c2', 0.2)}`
                    }}
                  />
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography variant="subtitle1" noWrap fontWeight="600">
                      {user.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                    <Chip 
                      label="View Profile" 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                      sx={{ mt: 0.5, height: 20 }}
                    />
                  </Box>
                </MenuItem>

                {/* Quick Actions */}
                <Box sx={{ px: 1, py: 1 }}>
                  <MenuItem 
                    onClick={() => { navigate('/dashboard'); handleClose(); }}
                    sx={{ borderRadius: 1, py: 1.5 }}
                  >
                    <DashboardIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="500">Dashboard</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Your activity overview
                      </Typography>
                    </Box>
                  </MenuItem>
                  
                  <MenuItem 
                    onClick={() => { navigate('/developement'); handleClose(); }}
                    sx={{ borderRadius: 1, py: 1.5 }}
                  >
                    <SchoolIcon sx={{ mr: 2, color: 'primary.main' }} />
                    <Box>
                      <Typography variant="body2" fontWeight="500">Professional Development</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Skills & courses
                      </Typography>
                    </Box>
                  </MenuItem>
                </Box>

                <Divider />

                {/* Settings & Logout */}
                <Box sx={{ px: 1, py: 1 }}>
                  <MenuItem 
                    onClick={() => { navigate('/settings'); handleClose(); }}
                    sx={{ borderRadius: 1 }}
                  >
                    <SettingsIcon sx={{ mr: 2 }} />
                    <Typography variant="body2">Settings</Typography>
                  </MenuItem>
                  
                  <MenuItem 
                    onClick={handleLogout}
                    sx={{ 
                      borderRadius: 1,
                      backgroundColor: alpha('#ff4757', 0.1),
                      '&:hover': {
                        backgroundColor: alpha('#ff4757', 0.2),
                      }
                    }}
                  >
                    <ExitToApp sx={{ mr: 2, color: 'error.main' }} />
                    <Typography color="error" fontWeight="500">Logout</Typography>
                  </MenuItem>
                </Box>
              </Menu>
            </Box>
          </>
        ) : (
          // Non-logged in state
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/login"
              sx={{ 
                textTransform: 'none',
                borderRadius: 3,
                px: 3,
                fontWeight: 500,
                fontSize: '0.9rem'
              }}
            >
              Sign In
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              component={Link} 
              to="/register"
              sx={{ 
                textTransform: 'none',
                borderRadius: 3,
                px: 3,
                fontWeight: 600,
                fontSize: '0.9rem',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(0,0,0,0.2)',
                  transform: 'translateY(-1px)'
                },
                transition: 'all 0.2s ease-in-out'
              }}
            >
              Join Now
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}