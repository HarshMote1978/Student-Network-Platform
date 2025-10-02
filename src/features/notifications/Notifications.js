import { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  updateDoc, doc, writeBatch, getDocs
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Box, List, ListItem, ListItemIcon, ListItemText, Typography,
  Badge, IconButton, Menu, MenuItem, Chip, Avatar, Button,
  Divider, Paper, alpha, useTheme
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  People as ConnectionIcon,
  Message as MessageIcon,
  Work as JobIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
  MarkEmailRead as MarkAsReadIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc'),
      orderBy('read', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = [];
      let unread = 0;

      snapshot.forEach((doc) => {
        const notif = { id: doc.id, ...doc.data() };
        notifs.push(notif);
        if (!notif.read) unread++;
      });

      setNotifications(notifs);
      setUnreadCount(unread);
    }, (error) => {
      console.error('Error fetching notifications:', error);
    });

    return () => unsubscribe();
  }, []);

  const markAsRead = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true,
        readTime: new Date()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const batch = writeBatch(db);
      const unreadNotifications = notifications.filter(notif => !notif.read);
      
      unreadNotifications.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, {
          read: true,
          readTime: new Date()
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.delete(notifRef);
      });
      
      await batch.commit();
      setAnchorEl(null);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'connection_request':
        navigate('/network');
        break;
      case 'message':
        navigate('/messages');
        break;
      case 'job_recommendation':
        navigate('/jobs');
        break;
      case 'event_invite':
        navigate('/events');
        break;
      case 'post_like':
      case 'post_comment':
        if (notification.postId) {
          navigate(`/post/${notification.postId}`);
        }
        break;
      default:
        break;
    }
    
    setAnchorEl(null);
  };

  const getNotificationIcon = (type) => {
    const iconStyle = { fontSize: 20 };
    
    switch (type) {
      case 'connection_request':
        return <ConnectionIcon sx={{ ...iconStyle, color: '#1976d2' }} />;
      case 'message':
        return <MessageIcon sx={{ ...iconStyle, color: '#2e7d32' }} />;
      case 'job_recommendation':
        return <JobIcon sx={{ ...iconStyle, color: '#ed6c02' }} />;
      case 'event_invite':
        return <EventIcon sx={{ ...iconStyle, color: '#9c27b0' }} />;
      case 'post_like':
        return <span style={{ ...iconStyle, color: '#d32f2f' }}>❤️</span>;
      case 'post_comment':
        return <span style={{ ...iconStyle, color: '#0288d1' }}>💬</span>;
      default:
        return <CircleIcon sx={{ ...iconStyle, color: '#757575' }} />;
    }
  };

  const getNotificationAvatar = (notification) => {
    if (notification.senderPhoto) {
      return <Avatar src={notification.senderPhoto} sx={{ width: 40, height: 40 }} />;
    }
    
    return (
      <Avatar sx={{ 
        width: 40, 
        height: 40,
        bgcolor: getNotificationColor(notification.type).background 
      }}>
        {getNotificationIcon(notification.type)}
      </Avatar>
    );
  };

  const getNotificationColor = (type) => {
    const colors = {
      connection_request: { background: '#e3f2fd', text: '#1976d2' },
      message: { background: '#e8f5e8', text: '#2e7d32' },
      job_recommendation: { background: '#fff3e0', text: '#ed6c02' },
      event_invite: { background: '#f3e5f5', text: '#9c27b0' },
      post_like: { background: '#ffebee', text: '#d32f2f' },
      post_comment: { background: '#e3f2fd', text: '#0288d1' }
    };
    
    return colors[type] || { background: '#f5f5f5', text: '#757575' };
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getActionButton = (notification) => {
    if (notification.type === 'connection_request') {
      return (
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Button size="small" variant="contained" color="primary">
            Accept
          </Button>
          <Button size="small" variant="outlined">
            Ignore
          </Button>
        </Box>
      );
    }
    
    return null;
  };

  if (!auth.currentUser) return null;

  return (
    <Box>
      <IconButton 
        color="inherit" 
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{
          position: 'relative',
          '&:hover': {
            backgroundColor: alpha(theme.palette.common.white, 0.1)
          }
        }}
      >
        <Badge badgeContent={unreadCount} color="error" max={9}>
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{ 
          sx: { 
            width: 400, 
            maxHeight: 500,
            mt: 1,
            boxShadow: theme.shadows[4]
          } 
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header - CORRECTED SECTION */}
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {unreadCount > 0 && (
                <Chip
                  icon={<MarkAsReadIcon />}
                  label="Mark all read"
                  size="small"
                  onClick={markAllAsRead}
                  color="primary"
                  variant="outlined"
                />
              )}
              {notifications.length > 0 && (
                <IconButton size="small" onClick={clearAllNotifications} title="Clear all">
                  <ClearIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          </Box>
          
          {unreadCount > 0 && (
            <Typography variant="body2" color="primary" sx={{ fontWeight: 500 }}>
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Divider />

        {/* Notifications List */}
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
              <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.5 }} />
              <Typography variant="body1">No notifications yet</Typography>
              <Typography variant="body2">
                Your notifications will appear here
              </Typography>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <ListItem
                    sx={{
                      py: 2,
                      px: 2,
                      cursor: 'pointer',
                      bgcolor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                      borderLeft: notification.read ? 'none' : `3px solid ${theme.palette.primary.main}`,
                      '&:hover': {
                        bgcolor: notification.read ? 'action.hover' : alpha(theme.palette.primary.main, 0.08)
                      },
                      transition: 'all 0.2s'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <ListItemIcon sx={{ minWidth: 56, mr: 2 }}>
                      {getNotificationAvatar(notification)}
                    </ListItemIcon>
                    
                    <ListItemText
                      primary={
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: notification.read ? 400 : 600,
                            mb: 0.5
                          }}
                        >
                          {notification.message}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography 
                            variant="caption" 
                            color="text.secondary"
                            sx={{ display: 'block' }}
                          >
                            {formatTime(notification.timestamp)}
                          </Typography>
                          {getActionButton(notification)}
                        </Box>
                      }
                    />
                    
                    {!notification.read && (
                      <CircleIcon 
                        sx={{ 
                          fontSize: 8, 
                          color: 'primary.main',
                          ml: 1 
                        }} 
                      />
                    )}
                  </ListItem>
                  
                  {index < notifications.length - 1 && <Divider variant="inset" />}
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button 
                size="small" 
                fullWidth
                onClick={() => {
                  navigate('/notifications');
                  setAnchorEl(null);
                }}
              >
                View All Notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </Box>
  );
}