import { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  updateDoc, doc, writeBatch
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Box, Container, Typography, Paper, List, ListItem,
  Avatar, Button, Chip, Divider, Tabs, Tab, IconButton
} from '@mui/material';
import {
  Notifications, CheckCircle, Delete, People, Message, Work, Event
} from '@mui/icons-material';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
    });

    return () => unsubscribe();
  }, []);

  const markAllAsRead = async () => {
    const batch = writeBatch(db);
    notifications.forEach(notif => {
      if (!notif.read) {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, { read: true, readTime: new Date() });
      }
    });
    await batch.commit();
  };

  const clearAllNotifications = async () => {
    const batch = writeBatch(db);
    notifications.forEach(notif => {
      const notifRef = doc(db, 'notifications', notif.id);
      batch.delete(notifRef);
    });
    await batch.commit();
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (activeTab) {
      case 0: return !notif.read; // Unread
      case 1: return notif.type === 'connection_request';
      case 2: return notif.type === 'message';
      case 3: return ['job_recommendation', 'event_invite'].includes(notif.type);
      default: return true;
    }
  });

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          <Notifications sx={{ mr: 2, verticalAlign: 'middle' }} />
          Notifications
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button startIcon={<CheckCircle />} onClick={markAllAsRead}>
            Mark All Read
          </Button>
          <Button startIcon={<Delete />} onClick={clearAllNotifications} color="secondary">
            Clear All
          </Button>
        </Box>
      </Box>

      <Paper>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab icon={<Notifications />} label="All" />
          <Tab icon={<People />} label="Connections" />
          <Tab icon={<Message />} label="Messages" />
          <Tab icon={<Work />} label="Opportunities" />
        </Tabs>

        <Box sx={{ p: 2 }}>
          <TabPanel value={activeTab} index={0}>
            <NotificationList notifications={filteredNotifications} />
          </TabPanel>
          <TabPanel value={activeTab} index={1}>
            <NotificationList notifications={filteredNotifications} />
          </TabPanel>
          <TabPanel value={activeTab} index={2}>
            <NotificationList notifications={filteredNotifications} />
          </TabPanel>
          <TabPanel value={activeTab} index={3}>
            <NotificationList notifications={filteredNotifications} />
          </TabPanel>
        </Box>
      </Paper>
    </Container>
  );
}

// Helper component for notification list
function NotificationList({ notifications }) {
  if (notifications.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
        <Notifications sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
        <Typography>No notifications found</Typography>
      </Box>
    );
  }

  return (
    <List>
      {notifications.map((notification, index) => (
        <Box key={notification.id}>
          <NotificationItem notification={notification} />
          {index < notifications.length - 1 && <Divider />}
        </Box>
      ))}
    </List>
  );
}

function NotificationItem({ notification }) {
  // Implementation similar to the main component
  return (
    <ListItem sx={{ alignItems: 'flex-start' }}>
      <Avatar sx={{ mr: 2, mt: 0.5 }}>N</Avatar>
      <Box sx={{ flexGrow: 1 }}>
        <Typography>{notification.message}</Typography>
        <Typography variant="caption" color="text.secondary">
          {notification.timestamp?.toDate().toLocaleString()}
        </Typography>
      </Box>
      {!notification.read && <Chip label="New" size="small" color="primary" />}
    </ListItem>
  );
}