import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth, storage } from '../../services/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { updateProfile, updateEmail } from 'firebase/auth';
import { 
  Avatar, 
  Button, 
  TextField, 
  Box, 
  Typography, 
  Paper,
  Divider,
  Chip,
  IconButton,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  InputAdornment,
  alpha,
  useTheme
} from '@mui/material';
import {
  Edit,
  Add,
  CameraAlt,
  LocationOn,
  Work,
  School,
  Link,
  Email,
  Phone,
  CalendarToday,
  Check,
  Close,
  LinkedIn,
  GitHub,
  Twitter,
  Save,
  Cancel,
  CloudUpload
} from '@mui/icons-material';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [editSection, setEditSection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ posts: 0, connections: 0, events: 0 });
  const theme = useTheme();

  // Enhanced profile structure
  const defaultProfile = {
    name: '',
    headline: '',
    about: '',
    location: '',
    email: '',
    phone: '',
    website: '',
    linkedin: '',
    github: '',
    twitter: '',
    skills: [],
    education: [],
    experience: [],
    photoURL: ''
  };

  useEffect(() => {
    fetchProfile();
    fetchUserStats();
  }, []);

  const fetchProfile = async () => {
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile({ ...defaultProfile, ...docSnap.data() });
      } else {
        const newProfile = {
          ...defaultProfile,
          name: auth.currentUser.displayName || '',
          email: auth.currentUser.email,
          photoURL: auth.currentUser.photoURL || ''
        };
        
        await updateDoc(docRef, newProfile);
        setProfile(newProfile);
      }
    } catch (error) {
      console.error("Error fetching profile: ", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      // Fetch user's posts count
      const postsQuery = query(
        collection(db, 'posts'),
        where('userId', '==', auth.currentUser.uid)
      );
      const postsSnapshot = await getDocs(postsQuery);

      // Fetch connections count (you'll need to implement this based on your data structure)
      const connections = profile?.connections?.length || 0;

      setStats({
        posts: postsSnapshot.size,
        connections: connections,
        events: 0 // Add events count if you have events
      });
    } catch (error) {
      console.error("Error fetching stats: ", error);
    }
  };

  const handlePhotoUpload = async () => {
    if (!photo) return;
    
    try {
      setLoading(true);
      
      // Delete old photo if exists
      if (profile.photoURL && profile.photoURL.includes('firebasestorage')) {
        const oldPhotoRef = ref(storage, profile.photoURL);
        await deleteObject(oldPhotoRef).catch(() => {}); // Ignore errors if file doesn't exist
      }

      // Upload new photo
      const storageRef = ref(storage, `profiles/${auth.currentUser.uid}/${photo.name}`);
      await uploadBytes(storageRef, photo);
      const photoURL = await getDownloadURL(storageRef);
      
      // Update Firestore and Auth
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, { photoURL });
      await updateProfile(auth.currentUser, { photoURL });
      
      setProfile({ ...profile, photoURL });
      setPhoto(null);
      setPhotoPreview('');
    } catch (error) {
      console.error("Error uploading photo: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(docRef, profile);
      
      // Update email if changed
      if (profile.email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, profile.email);
      }
      
      setEditMode(false);
      setEditSection(null);
    } catch (error) {
      console.error("Error updating profile: ", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (skill) => {
    if (skill.trim() && !profile.skills.includes(skill.trim())) {
      const updatedSkills = [...profile.skills, skill.trim()];
      setProfile({ ...profile, skills: updatedSkills });
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    const updatedSkills = profile.skills.filter(skill => skill !== skillToRemove);
    setProfile({ ...profile, skills: updatedSkills });
  };

  const ProfileStats = () => (
    <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
      <Card sx={{ textAlign: 'center', flex: 1, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <CardContent>
          <Typography variant="h4" color="primary" fontWeight="bold">
            {stats.posts}
          </Typography>
          <Typography color="text.secondary">Posts</Typography>
        </CardContent>
      </Card>
      <Card sx={{ textAlign: 'center', flex: 1, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
        <CardContent>
          <Typography variant="h4" color="success.main" fontWeight="bold">
            {stats.connections}
          </Typography>
          <Typography color="text.secondary">Connections</Typography>
        </CardContent>
      </Card>
      <Card sx={{ textAlign: 'center', flex: 1, bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
        <CardContent>
          <Typography variant="h4" color="warning.main" fontWeight="bold">
            {stats.events}
          </Typography>
          <Typography color="text.secondary">Events</Typography>
        </CardContent>
      </Card>
    </Box>
  );

  const ProfileCompletion = () => {
    const completion = calculateProfileCompletion();
    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Profile Strength</Typography>
            <Typography color="primary" fontWeight="bold">{completion}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completion} 
            sx={{ height: 8, borderRadius: 4, mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary">
            Complete your profile to increase visibility
          </Typography>
        </CardContent>
      </Card>
    );
  };

  const calculateProfileCompletion = () => {
    let completed = 0;
    const fields = [
      profile?.name, profile?.headline, profile?.about, 
      profile?.photoURL, profile?.skills?.length, profile?.education?.length
    ];
    
    fields.forEach(field => {
      if (field && (typeof field === 'string' ? field.trim() !== '' : field.length > 0)) {
        completed++;
      }
    });
    
    return Math.round((completed / fields.length) * 100);
  };

  const PhotoUploadSection = () => (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Box sx={{ position: 'relative', display: 'inline-block' }}>
        <Avatar 
          src={photoPreview || profile?.photoURL} 
          sx={{ 
            width: 150, 
            height: 150,
            mb: 2,
            border: `4px solid ${theme.palette.primary.main}`,
            boxShadow: theme.shadows[4]
          }}
        />
        <input
          type="file"
          accept="image/*"
          id="profile-photo-upload"
          style={{ display: 'none' }}
          onChange={handlePhotoChange}
        />
        <label htmlFor="profile-photo-upload">
          <IconButton 
            component="span"
            sx={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              bgcolor: 'primary.main',
              color: 'white',
              '&:hover': { bgcolor: 'primary.dark' }
            }}
          >
            <CameraAlt />
          </IconButton>
        </label>
      </Box>
      
      {photo && (
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<CloudUpload />}
            onClick={handlePhotoUpload}
            disabled={loading}
          >
            Upload Photo
          </Button>
          <Button 
            variant="outlined"
            onClick={() => {
              setPhoto(null);
              setPhotoPreview('');
            }}
          >
            Cancel
          </Button>
        </Box>
      )}
    </Box>
  );

  const BasicInfoSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">Basic Information</Typography>
          <IconButton onClick={() => setEditSection('basic')}>
            <Edit />
          </IconButton>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Full Name</Typography>
            <Typography variant="body1" fontWeight="medium">{profile?.name || 'Not set'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Headline</Typography>
            <Typography variant="body1" fontWeight="medium">
              {profile?.headline || 'No headline added'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Email</Typography>
            <Typography variant="body1" fontWeight="medium">{profile?.email}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="body2" color="text.secondary">Location</Typography>
            <Typography variant="body1" fontWeight="medium">
              {profile?.location || 'Not specified'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const SkillsSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">Skills & Expertise</Typography>
          <IconButton onClick={() => setEditSection('skills')}>
            <Edit />
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {profile?.skills?.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              color="primary"
              variant="outlined"
              onDelete={editMode ? () => handleRemoveSkill(skill) : undefined}
            />
          ))}
          {(!profile?.skills || profile.skills.length === 0) && (
            <Typography color="text.secondary">No skills added yet</Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );

  const AboutSection = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" fontWeight="bold">About</Typography>
          <IconButton onClick={() => setEditSection('about')}>
            <Edit />
          </IconButton>
        </Box>
        
        <Typography variant="body1" paragraph>
          {profile?.about || 'No about information added. Share your professional story and background.'}
        </Typography>
      </CardContent>
    </Card>
  );

  const EditDialog = () => {
    const [localProfile, setLocalProfile] = useState(profile);

    const handleSave = () => {
      setProfile(localProfile);
      handleSaveProfile();
    };

    return (
      <Dialog open={!!editSection} onClose={() => setEditSection(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit {editSection === 'basic' ? 'Basic Information' : 
                editSection === 'skills' ? 'Skills' : 'About'}
        </DialogTitle>
        <DialogContent>
          {editSection === 'basic' && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  fullWidth
                  value={localProfile?.name}
                  onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Headline"
                  fullWidth
                  value={localProfile?.headline}
                  onChange={(e) => setLocalProfile({ ...localProfile, headline: e.target.value })}
                  placeholder="e.g. Software Engineer | React Developer"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email"
                  fullWidth
                  type="email"
                  value={localProfile?.email}
                  onChange={(e) => setLocalProfile({ ...localProfile, email: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Location"
                  fullWidth
                  value={localProfile?.location}
                  onChange={(e) => setLocalProfile({ ...localProfile, location: e.target.value })}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LocationOn /></InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          )}

          {editSection === 'skills' && (
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  label="Add Skill"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddSkill(e.target.value);
                      e.target.value = '';
                    }
                  }}
                />
                <Button variant="contained" onClick={() => {
                  const input = document.querySelector('input[type="text"]');
                  if (input) {
                    handleAddSkill(input.value);
                    input.value = '';
                  }
                }}>
                  Add
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {localProfile?.skills?.map((skill, index) => (
                  <Chip
                    key={index}
                    label={skill}
                    onDelete={() => {
                      const updatedSkills = localProfile.skills.filter(s => s !== skill);
                      setLocalProfile({ ...localProfile, skills: updatedSkills });
                    }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {editSection === 'about' && (
            <TextField
              label="About"
              fullWidth
              multiline
              rows={6}
              value={localProfile?.about}
              onChange={(e) => setLocalProfile({ ...localProfile, about: e.target.value })}
              sx={{ mt: 1 }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSection(null)}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={loading}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading && !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Loading profile...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
      {/* Header Section */}
      <Paper elevation={0} sx={{ 
        p: 4, 
        mb: 3, 
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: 'white',
        borderRadius: 3
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
          <Typography variant="h3" fontWeight="bold">
            My Profile
          </Typography>
          <Button 
            variant="contained" 
            startIcon={editMode ? <Close /> : <Edit />}
            onClick={() => setEditMode(!editMode)}
            sx={{ 
              bgcolor: 'white', 
              color: 'primary.main',
              '&:hover': { bgcolor: 'grey.100' }
            }}
          >
            {editMode ? 'Cancel Editing' : 'Edit Profile'}
          </Button>
        </Box>

        <ProfileStats />
      </Paper>

      <Grid container spacing={3}>
        {/* Left Sidebar */}
        <Grid item xs={12} md={4}>
          <PhotoUploadSection />
          <ProfileCompletion />
          
          {/* Contact Info Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">Contact Info</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email color="action" />
                  <Typography variant="body2">{profile?.email}</Typography>
                </Box>
                {profile?.location && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocationOn color="action" />
                    <Typography variant="body2">{profile.location}</Typography>
                  </Box>
                )}
                {profile?.website && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Link color="action" />
                    <Typography variant="body2">{profile.website}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Main Content */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper'
              }}
            >
              <Tab label="Overview" />
              <Tab label="Activity" />
              <Tab label="Connections" />
            </Tabs>

            <TabPanel value={activeTab} index={0}>
              <BasicInfoSection />
              <AboutSection />
              <SkillsSection />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Your Activity
                  </Typography>
                  <Typography color="text.secondary">
                    Posts, comments, and interactions will appear here
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Your Connections
                  </Typography>
                  <Typography color="text.secondary">
                    Your professional network will appear here
                  </Typography>
                </CardContent>
              </Card>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      <EditDialog />
    </Box>
  );
}