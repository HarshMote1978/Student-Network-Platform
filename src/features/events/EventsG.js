import { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  updateDoc, doc, arrayUnion, where, getDocs 
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Box, Card, CardContent, Typography, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Grid, Avatar, IconButton, Paper, Tabs, Tab, Snackbar, Alert,
  LinearProgress, Divider, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import {
  Event as EventIcon,
  Group as GroupIcon,
  LocationOn as LocationOnIcon,
  CalendarToday as CalendarTodayIcon,
  Add as AddIcon,
  People as PeopleIcon,
  AccessTime as AccessTimeIcon,
  Category as CategoryIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { format, isAfter, isBefore, parseISO } from 'date-fns';
import { increment } from 'firebase/firestore';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [eventForm, setEventForm] = useState({
    title: '', 
    description: '', 
    date: '', 
    time: '', 
    location: '', 
    type: 'virtual', 
    category: 'networking',
    maxAttendees: 100
  });
  const [groupForm, setGroupForm] = useState({
    name: '', 
    description: '', 
    category: 'professional',
    rules: '',
    tags: []
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const eventsQuery = query(
      collection(db, 'events'), 
      orderBy('date', 'asc')
    );
    
    const groupsQuery = query(
      collection(db, 'groups'), 
      orderBy('createdAt', 'desc')
    );

    const unsubscribeEvents = onSnapshot(eventsQuery, 
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
        }));
        setEvents(eventsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching events:', error);
        setSnackbar({ open: true, message: 'Error loading events', severity: 'error' });
        setLoading(false);
      }
    );

    const unsubscribeGroups = onSnapshot(groupsQuery, 
      (snapshot) => {
        const groupsData = snapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        }));
        setGroups(groupsData);
      },
      (error) => {
        console.error('Error fetching groups:', error);
        setSnackbar({ open: true, message: 'Error loading groups', severity: 'error' });
      }
    );

    return () => {
      unsubscribeEvents();
      unsubscribeGroups();
    };
  }, []);

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const createEvent = async () => {
    if (!eventForm.title || !eventForm.date || !eventForm.time) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'events'), {
        ...eventForm,
        createdBy: auth.currentUser.uid,
        createdByName: auth.currentUser.displayName,
        createdByPhoto: auth.currentUser.photoURL,
        createdAt: new Date(),
        attendees: [auth.currentUser.uid],
        attendeeNames: [auth.currentUser.displayName],
        status: 'upcoming',
        isActive: true
      });
      
      setEventForm({ 
        title: '', description: '', date: '', time: '', 
        location: '', type: 'virtual', category: 'networking', maxAttendees: 100 
      });
      setShowEventForm(false);
      showMessage('Event created successfully!');
    } catch (error) {
      console.error('Error creating event:', error);
      showMessage('Error creating event', 'error');
    }
  };

  const createGroup = async () => {
    if (!groupForm.name || !groupForm.description) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'groups'), {
        ...groupForm,
        createdBy: auth.currentUser.uid,
        createdByName: auth.currentUser.displayName,
        createdByPhoto: auth.currentUser.photoURL,
        createdAt: new Date(),
        members: [auth.currentUser.uid],
        memberNames: [auth.currentUser.displayName],
        memberCount: 1,
        isActive: true
      });
      
      setGroupForm({ name: '', description: '', category: 'professional', rules: '', tags: [] });
      setShowGroupForm(false);
      showMessage('Group created successfully!');
    } catch (error) {
      console.error('Error creating group:', error);
      showMessage('Error creating group', 'error');
    }
  };

  const joinEvent = async (eventId, eventTitle) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      await updateDoc(eventRef, {
        attendees: arrayUnion(auth.currentUser.uid),
        attendeeNames: arrayUnion(auth.currentUser.displayName)
      });
      showMessage(`You've joined "${eventTitle}"!`);
    } catch (error) {
      console.error('Error joining event:', error);
      showMessage('Error joining event', 'error');
    }
  };

  const joinGroup = async (groupId, groupName) => {
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        members: arrayUnion(auth.currentUser.uid),
        memberNames: arrayUnion(auth.currentUser.displayName),
        memberCount: increment(1)
      });
      showMessage(`You've joined "${groupName}"!`);
    } catch (error) {
      console.error('Error joining group:', error);
      showMessage('Error joining group', 'error');
    }
  };

  const isEventFull = (event) => {
    return event.attendees && event.attendees.length >= event.maxAttendees;
  };

  const isUserAttending = (item, type) => {
    const attendees = type === 'event' ? item.attendees : item.members;
    return attendees && attendees.includes(auth.currentUser.uid);
  };

  const getEventStatus = (event) => {
    const now = new Date();
    const eventDate = event.date instanceof Date ? event.date : new Date(event.date);
    
    if (isBefore(eventDate, now)) return 'past';
    if (isAfter(eventDate, now)) return 'upcoming';
    return 'ongoing';
  };

  const EventCard = ({ event }) => {
    const status = getEventStatus(event);
    const userAttending = isUserAttending(event, 'event');
    const full = isEventFull(event);

    return (
      <Card sx={{ 
        mb: 2, 
        borderLeft: `4px solid ${
          status === 'past' ? '#ccc' : 
          status === 'ongoing' ? '#ff9800' : '#4caf50'
        }`
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography variant="h6" sx={{ flex: 1 }}>{event.title}</Typography>
            <Chip 
              label={status.toUpperCase()} 
              size="small" 
              color={
                status === 'past' ? 'default' : 
                status === 'ongoing' ? 'warning' : 'success'
              }
            />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <CalendarTodayIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2">
                {format(event.date instanceof Date ? event.date : new Date(event.date), 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <AccessTimeIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2">{event.time}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOnIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {event.type === 'virtual' ? 'Virtual Event' : event.location}
              </Typography>
            </Box>
          </Box>

          <Typography paragraph sx={{ mb: 2 }}>{event.description}</Typography>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                icon={<PeopleIcon />}
                label={`${event.attendees?.length || 0}/${event.maxAttendees || '∞'} attending`}
                size="small"
                color={full ? 'error' : 'default'}
              />
              <Chip
                icon={<CategoryIcon />}
                label={event.category}
                size="small"
                variant="outlined"
              />
            </Box>
            
            <Button 
              variant={userAttending ? "outlined" : "contained"}
              onClick={() => joinEvent(event.id, event.title)}
              disabled={userAttending || full || status === 'past'}
              startIcon={userAttending ? <CheckCircleIcon /> : <PeopleIcon />}
            >
              {userAttending ? 'Attending' : full ? 'Full' : 'Attend Event'}
            </Button>
          </Box>

          {event.createdByName && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={event.createdByPhoto} 
                sx={{ width: 24, height: 24, mr: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Hosted by {event.createdByName}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  const GroupCard = ({ group }) => {
    const userMember = isUserAttending(group, 'group');

    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 56, height: 56 }}>
              <GroupIcon />
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6">{group.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {group.category} group • Created {group.createdAt ? format(group.createdAt, 'MMM dd, yyyy') : 'recently'}
              </Typography>
            </Box>
          </Box>

          <Typography paragraph sx={{ mb: 2 }}>{group.description}</Typography>

          {group.rules && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
              Group rules: {group.rules}
            </Typography>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip
              icon={<PeopleIcon />}
              label={`${group.memberCount || group.members?.length || 0} members`}
              size="small"
            />
            
            <Button 
              variant={userMember ? "outlined" : "contained"}
              onClick={() => joinGroup(group.id, group.name)}
              disabled={userMember}
              startIcon={userMember ? <CheckCircleIcon /> : <GroupIcon />}
            >
              {userMember ? 'Member' : 'Join Group'}
            </Button>
          </Box>

          {group.createdByName && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
              <Avatar 
                src={group.createdByPhoto} 
                sx={{ width: 24, height: 24, mr: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                Created by {group.createdByName}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1">
          <EventIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
          Events & Groups
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowEventForm(true)}>
            Create Event
          </Button>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setShowGroupForm(true)}>
            Create Group
          </Button>
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
          <Tab icon={<EventIcon />} label={`Events (${events.length})`} />
          <Tab icon={<GroupIcon />} label={`Groups (${groups.length})`} />
        </Tabs>
      </Paper>

      {/* Content */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Upcoming Events
            </Typography>
            <Box>
              {events.filter(event => getEventStatus(event) === 'upcoming').map(event => (
                <EventCard key={event.id} event={event} />
              ))}
              
              {events.filter(event => getEventStatus(event) === 'upcoming').length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <EventIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>No upcoming events</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Be the first to create an event and connect with professionals
                  </Typography>
                  <Button variant="contained" onClick={() => setShowEventForm(true)}>
                    Create First Event
                  </Button>
                </Paper>
              )}
            </Box>

            {events.filter(event => getEventStatus(event) === 'past').length > 0 && (
              <>
                <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 3 }}>
                  Past Events
                </Typography>
                {events.filter(event => getEventStatus(event) === 'past').map(event => (
                  <EventCard key={event.id} event={event} />
                ))}
              </>
            )}
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
              <Typography variant="h6" gutterBottom>Event Statistics</Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="Upcoming Events" 
                    secondary={events.filter(e => getEventStatus(e) === 'upcoming').length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Events You're Attending" 
                    secondary={events.filter(e => isUserAttending(e, 'event')).length}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Total Events" 
                    secondary={events.length}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              Professional Groups
            </Typography>
            <Box>
              {groups.map(group => (
                <GroupCard key={group.id} group={group} />
              ))}
              
              {groups.length === 0 && (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <GroupIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>No groups yet</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start a group to connect with like-minded professionals
                  </Typography>
                  <Button variant="contained" onClick={() => setShowGroupForm(true)}>
                    Create First Group
                  </Button>
                </Paper>
              )}
            </Box>
          </Grid>

           <Grid item xs={12} lg={4}>
  <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
    <Typography variant="h6" gutterBottom>Group Statistics</Typography>
    <List>
      <ListItem>
        <ListItemText 
          primary="Total Groups" 
          secondary={groups.length}
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="Groups You've Joined" 
          secondary={groups.filter(g => isUserAttending(g, 'group')).length}
        />
      </ListItem>
      <ListItem>
        <ListItemText 
          primary="Most Popular Category" 
          secondary={
            groups.length > 0 ? 
              (() => {
                const categoryCounts = groups.reduce((acc, group) => {
                  acc[group.category] = (acc[group.category] || 0) + 1;
                  return acc;
                }, {});
                
                // Find the most popular category
                const mostPopular = Object.entries(categoryCounts)
                  .sort((a, b) => b[1] - a[1])[0];
                
                return mostPopular ? `${mostPopular[0]} (${mostPopular[1]})` : 'None';
              })() 
              : 'None'
          }
        />
      </ListItem>
    </List>
  </Paper>
</Grid>
        </Grid>
      )}

      {/* Event Creation Dialog */}
      <Dialog open={showEventForm} onClose={() => setShowEventForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Event</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Event Title *"
            fullWidth
            value={eventForm.title}
            onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description *"
            multiline
            rows={3}
            fullWidth
            value={eventForm.description}
            onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Date *"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={eventForm.date}
                onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Time *"
                type="time"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={eventForm.time}
                onChange={(e) => setEventForm({...eventForm, time: e.target.value})}
              />
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Location *"
            fullWidth
            value={eventForm.location}
            onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                margin="dense"
                label="Event Type *"
                fullWidth
                value={eventForm.type}
                onChange={(e) => setEventForm({...eventForm, type: e.target.value})}
              >
                <MenuItem value="virtual">Virtual</MenuItem>
                <MenuItem value="in-person">In-Person</MenuItem>
                <MenuItem value="hybrid">Hybrid</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                margin="dense"
                label="Category *"
                fullWidth
                value={eventForm.category}
                onChange={(e) => setEventForm({...eventForm, category: e.target.value})}
              >
                <MenuItem value="networking">Networking</MenuItem>
                <MenuItem value="workshop">Workshop</MenuItem>
                <MenuItem value="conference">Conference</MenuItem>
                <MenuItem value="social">Social</MenuItem>
                <MenuItem value="career">Career Fair</MenuItem>
              </TextField>
            </Grid>
          </Grid>
          <TextField
            margin="dense"
            label="Maximum Attendees"
            type="number"
            fullWidth
            value={eventForm.maxAttendees}
            onChange={(e) => setEventForm({...eventForm, maxAttendees: parseInt(e.target.value) || 100})}
            helperText="Leave empty for unlimited attendees"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEventForm(false)}>Cancel</Button>
          <Button onClick={createEvent} variant="contained">Create Event</Button>
        </DialogActions>
      </Dialog>

      {/* Group Creation Dialog */}
      <Dialog open={showGroupForm} onClose={() => setShowGroupForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name *"
            fullWidth
            value={groupForm.name}
            onChange={(e) => setGroupForm({...groupForm, name: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description *"
            multiline
            rows={3}
            fullWidth
            value={groupForm.description}
            onChange={(e) => setGroupForm({...groupForm, description: e.target.value})}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            margin="dense"
            label="Category *"
            fullWidth
            value={groupForm.category}
            onChange={(e) => setGroupForm({...groupForm, category: e.target.value})}
            sx={{ mb: 2 }}
          >
            <MenuItem value="professional">Professional</MenuItem>
            <MenuItem value="technical">Technical</MenuItem>
            <MenuItem value="educational">Educational</MenuItem>
            <MenuItem value="networking">Networking</MenuItem>
            <MenuItem value="alumni">Alumni</MenuItem>
            <MenuItem value="hobby">Hobby & Interest</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Group Rules (Optional)"
            multiline
            rows={2}
            fullWidth
            value={groupForm.rules}
            onChange={(e) => setGroupForm({...groupForm, rules: e.target.value})}
            helperText="Set guidelines for your group members"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowGroupForm(false)}>Cancel</Button>
          <Button onClick={createGroup} variant="contained">Create Group</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}