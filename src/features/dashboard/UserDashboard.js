import { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  doc, getDoc, getDocs 
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Box, Grid, Paper, Typography, Card, CardContent,
  Avatar, LinearProgress, Chip, Button, List, ListItem,
  ListItemAvatar, ListItemText, Divider, Tabs, Tab,
  Container, alpha, useTheme
} from '@mui/material';
import {
  Person as PersonIcon, 
  Work as WorkIcon, 
  Article as ArticleIcon, 
  Event as EventIcon,
  TrendingUp as TrendingUpIcon, 
  Group as GroupIcon, 
  Notifications as NotificationsIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';

export default function UserDashboard() {
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activityFeed, setActivityFeed] = useState([]);
  const [stats, setStats] = useState({
    connections: 0,
    posts: 0,
    jobsApplied: 0,
    eventsAttending: 0
  });
  const theme = useTheme();

  useEffect(() => {
    if (!auth.currentUser) return;

    // Load user profile
    const loadUserProfile = async () => {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    };

    // Load activity feed (combined from multiple collections)
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribeActivities = onSnapshot(activitiesQuery, (snapshot) => {
      const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActivityFeed(activities);
    });

    // Load statistics
    const loadStats = async () => {
      const connectionsQuery = query(
        collection(db, 'connections'),
        where('userId', '==', auth.currentUser.uid)
      );
      
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', auth.currentUser.uid)
      );

      const applicationsQuery = query(
        collection(db, 'applications'),
        where('applicantId', '==', auth.currentUser.uid)
      );

      const eventsQuery = query(
        collection(db, 'eventAttendees'),
        where('userId', '==', auth.currentUser.uid)
      );

      const [connectionsSnap, postsSnap, applicationsSnap, eventsSnap] = await Promise.all([
        getDocs(connectionsQuery),
        getDocs(postsQuery),
        getDocs(applicationsQuery),
        getDocs(eventsQuery)
      ]);

      setStats({
        connections: connectionsSnap.size,
        posts: postsSnap.size,
        jobsApplied: applicationsSnap.size,
        eventsAttending: eventsSnap.size
      });
    };

    loadUserProfile();
    loadStats();

    return () => unsubscribeActivities();
  }, []);

  const renderActivityItem = (activity) => {
    const getActivityIcon = () => {
      switch (activity.type) {
        case 'post':
          return <ArticleIcon color="primary" />;
        case 'connection':
          return <PersonIcon color="success" />;
        case 'job_application':
          return <WorkIcon color="warning" />;
        default:
          return <NotificationsIcon />;
      }
    };

    const getActivityTitle = () => {
      switch (activity.type) {
        case 'post':
          return "You created a new post";
        case 'connection':
          return "You made a new connection";
        case 'job_application':
          return "You applied for a job";
        default:
          return "New activity";
      }
    };

    const getActivityDescription = () => {
      switch (activity.type) {
        case 'post':
          return "Shared with your network";
        case 'connection':
          return `Connected with ${activity.targetName || 'a new professional'}`;
        case 'job_application':
          return `Applied to ${activity.jobTitle || 'a position'} at ${activity.company || 'a company'}`;
        default:
          return "New update in your network";
      }
    };

    return (
      <ListItem 
        alignItems="flex-start" 
        sx={{ 
          py: 2,
          transition: 'background-color 0.2s',
          '&:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.05)
          }
        }}
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
            {getActivityIcon()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {getActivityTitle()}
              </Typography>
              <Chip 
                icon={<ScheduleIcon />} 
                label={new Date(activity.timestamp?.toDate()).toLocaleDateString()} 
                size="small" 
                sx={{ ml: 1 }} 
              />
            </Box>
          }
          secondary={
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {getActivityDescription()}
            </Typography>
          }
        />
      </ListItem>
    );
  };

  const StatCard = ({ icon, value, label, color = "primary" }) => (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent sx={{ textAlign: 'center', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Avatar sx={{ bgcolor: alpha(theme.palette[color].main, 0.1), color: theme.palette[color].main }}>
            {icon}
          </Avatar>
        </Box>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Dashboard
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Welcome back, {userProfile?.name || 'there'}! Here's what's happening with your professional network.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Summary */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper 
            sx={{ 
              p: 3, 
              textAlign: 'center',
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
              borderRadius: 3
            }}
          >
            <Avatar
              src={userProfile?.photoURL}
              sx={{ 
                width: 120, 
                height: 120, 
                mx: 'auto', 
                mb: 2,
                border: `4px solid ${theme.palette.background.paper}`,
                boxShadow: theme.shadows[4]
              }}
            />
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              {userProfile?.name || 'Unknown User'}
            </Typography>
            <Typography variant="body2" color="primary" gutterBottom sx={{ fontWeight: 500 }}>
              {userProfile?.headline || 'No headline yet'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {userProfile?.location || 'Location not specified'}
            </Typography>
            
            <Box sx={{ mt: 2, mb: 3 }}>
              {userProfile?.skills?.slice(0, 4).map(skill => (
                <Chip 
                  key={skill} 
                  label={skill} 
                  size="small" 
                  sx={{ m: 0.5, bgcolor: alpha(theme.palette.primary.main, 0.1) }} 
                />
              ))}
              {(!userProfile?.skills || userProfile.skills.length === 0) && (
                <Typography variant="body2" color="text.secondary">
                  No skills added yet
                </Typography>
              )}
            </Box>

            <Button 
              variant="outlined" 
              startIcon={<EditIcon />} 
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Edit Profile
            </Button>
          </Paper>

          {/* Profile Completion */}
          <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircleIcon sx={{ mr: 1, color: 'success.main' }} />
              Profile Strength
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={75} 
              sx={{ 
                height: 10, 
                borderRadius: 5, 
                mb: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 5,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
                }
              }} 
            />
            <Typography variant="body2" color="text.secondary">
              Your profile is 75% complete. Add more information to improve your visibility.
            </Typography>
          </Paper>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8} lg={9}>
          {/* Statistics Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} sm={3}>
              <StatCard 
                icon={<PersonIcon />} 
                value={stats.connections} 
                label="Connections" 
                color="primary"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard 
                icon={<ArticleIcon />} 
                value={stats.posts} 
                label="Posts" 
                color="info"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard 
                icon={<WorkIcon />} 
                value={stats.jobsApplied} 
                label="Applications" 
                color="warning"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatCard 
                icon={<EventIcon />} 
                value={stats.eventsAttending} 
                label="Events" 
                color="success"
              />
            </Grid>
          </Grid>

          {/* Activity Feed */}
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
            }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                textColor="inherit"
                indicatorColor="secondary"
                sx={{
                  '& .MuiTab-root': { 
                    color: alpha('#fff', 0.7),
                    fontWeight: 500,
                    fontSize: '0.95rem'
                  },
                  '& .MuiTab-root.Mui-selected': { 
                    color: '#fff',
                    fontWeight: 600
                  }
                }}
              >
                <Tab label="Activity Feed" />
                <Tab label="Recent Notifications" />
                <Tab label="Network Updates" />
              </Tabs>
            </Box>

            <Box sx={{ p: 0 }}>
              {activeTab === 0 && (
                <List sx={{ p: 0 }}>
                  {activityFeed.slice(0, 5).map(activity => (
                    <Box key={activity.id}>
                      {renderActivityItem(activity)}
                      <Divider variant="fullWidth" />
                    </Box>
                  ))}
                  {activityFeed.length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <ArticleIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                      <Typography variant="h6" color="text.secondary">
                        No recent activity
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Your activities will appear here once you start using the platform.
                      </Typography>
                    </Box>
                  )}
                </List>
              )}

              {activeTab === 1 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    No new notifications
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You're all caught up! Notifications will appear here.
                  </Typography>
                </Box>
              )}

              {activeTab === 2 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <GroupIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="h6" color="text.secondary">
                    No network updates
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Updates from your network will appear here.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}