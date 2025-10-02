import { useState, useEffect } from 'react';
import {
  collection, query, where, orderBy, onSnapshot,
  addDoc, doc, updateDoc, arrayUnion, getDocs, increment
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Box, Grid, Paper, Typography, Card, CardContent,
  Button, Chip, LinearProgress, List, ListItem,
  ListItemIcon, ListItemText, Divider, Tabs, Tab,
  Rating, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, MenuItem, Container, alpha, useTheme,
  Avatar, IconButton, Badge, Stepper, Step, StepLabel,
  CardActions, Alert, Switch, FormControlLabel
} from '@mui/material';
import {
  School as SchoolIcon,
  Work as WorkIcon,
  TrendingUp as TrendingUpIcon,
  Psychology as PsychologyIcon,
  Groups as GroupsIcon,
  EmojiEvents as EmojiEventsIcon,
  Add as AddIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  ThumbUp as ThumbUpIcon,
  Person as PersonIcon,
  LocalLibrary as LocalLibraryIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  BusinessCenter as BusinessCenterIcon,
  Apartment as ApartmentIcon,
  Engineering as EngineeringIcon
} from '@mui/icons-material';

export default function ProfessionalDevelopment() {
  const [activeTab, setActiveTab] = useState(0);
  const [skills, setSkills] = useState([]);
  const [courses, setCourses] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [newSkill, setNewSkill] = useState({ name: '', proficiency: 3, category: 'Technical' });
  const [newCourse, setNewCourse] = useState({ 
    title: '', description: '', instructor: '', duration: '', level: 'Beginner', category: 'Technical' 
  });
  const theme = useTheme();

  useEffect(() => {
    if (!auth.currentUser) return;

    // Load user profile with educational data
    const userQuery = query(
      collection(db, 'users'),
      where('uid', '==', auth.currentUser.uid)
    );
    const unsubscribeUser = onSnapshot(userQuery, (snapshot) => {
      if (!snapshot.empty) {
        setUserProfile(snapshot.docs[0].data());
      }
    });

    // Load user skills
    const skillsQuery = query(
      collection(db, 'userSkills'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribeSkills = onSnapshot(skillsQuery, (snapshot) => {
      const skillsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSkills(skillsData);
    });

    // Load courses
    const coursesQuery = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
    const unsubscribeCourses = onSnapshot(coursesQuery, (snapshot) => {
      const coursesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(coursesData);
    });

    // Load user achievements
    const achievementsQuery = query(
      collection(db, 'userAchievements'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('earnedAt', 'desc')
    );
    const unsubscribeAchievements = onSnapshot(achievementsQuery, (snapshot) => {
      const achievementsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAchievements(achievementsData);
    });

    // Load course enrollments
    const enrollmentsQuery = query(
      collection(db, 'courseEnrollments'),
      where('userId', '==', auth.currentUser.uid),
      orderBy('enrolledAt', 'desc')
    );
    const unsubscribeEnrollments = onSnapshot(enrollmentsQuery, (snapshot) => {
      const enrollmentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEnrollments(enrollmentsData);
    });

    return () => {
      unsubscribeUser();
      unsubscribeSkills();
      unsubscribeCourses();
      unsubscribeAchievements();
      unsubscribeEnrollments();
    };
  }, []);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    const totalCourses = courses.length;
    const completedCourses = enrollments.filter(e => e.progress === 100).length;
    const skillProgress = skills.length > 0 ? (skills.reduce((sum, skill) => sum + skill.proficiency, 0) / (skills.length * 5)) * 100 : 0;
    
    return {
      courseProgress: totalCourses > 0 ? (completedCourses / totalCourses) * 100 : 0,
      skillProgress: skillProgress,
      overallProgress: (skillProgress + (completedCourses / Math.max(totalCourses, 1)) * 100) / 2
    };
  };

  const addSkill = async () => {
    if (!newSkill.name.trim()) return;
    try {
      await addDoc(collection(db, 'userSkills'), {
        userId: auth.currentUser.uid,
        name: newSkill.name.trim(),
        proficiency: newSkill.proficiency,
        category: newSkill.category,
        endorsements: [],
        createdAt: new Date(),
        lastPracticed: new Date()
      });
      setNewSkill({ name: '', proficiency: 3, category: 'Technical' });
      setShowAddSkill(false);
    } catch (error) {
      console.error('Error adding skill:', error);
    }
  };

  const addCourse = async () => {
    if (!newCourse.title.trim() || !newCourse.description.trim()) return;
    try {
      await addDoc(collection(db, 'courses'), {
        ...newCourse,
        createdBy: auth.currentUser.uid,
        createdAt: new Date(),
        enrolledCount: 0,
        rating: 0,
        isActive: true
      });
      setNewCourse({ title: '', description: '', instructor: '', duration: '', level: 'Beginner', category: 'Technical' });
      setShowCourseForm(false);
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const endorseSkill = async (skillId, currentEndorsements = []) => {
    try {
      if (currentEndorsements.includes(auth.currentUser.uid)) {
        alert('You have already endorsed this skill!');
        return;
      }
      await updateDoc(doc(db, 'userSkills', skillId), {
        endorsements: arrayUnion(auth.currentUser.uid)
      });
    } catch (error) {
      console.error('Error endorsing skill:', error);
    }
  };

  const enrollCourse = async (courseId) => {
    try {
      const enrollmentQuery = query(
        collection(db, 'courseEnrollments'),
        where('userId', '==', auth.currentUser.uid),
        where('courseId', '==', courseId)
      );
      const enrollmentSnapshot = await getDocs(enrollmentQuery);
      if (!enrollmentSnapshot.empty) {
        alert('You are already enrolled in this course!');
        return;
      }
      await addDoc(collection(db, 'courseEnrollments'), {
        userId: auth.currentUser.uid,
        courseId,
        enrolledAt: new Date(),
        progress: 0,
        status: 'enrolled',
        completed: false
      });
      // Update course enrollment count
      const courseRef = doc(db, 'courses', courseId);
      await updateDoc(courseRef, {
        enrolledCount: increment(1)
      });
      alert('Successfully enrolled in the course!');
    } catch (error) {
      console.error('Error enrolling in course:', error);
    }
  };

  const updateCourseProgress = async (enrollmentId, progress) => {
    try {
      await updateDoc(doc(db, 'courseEnrollments', enrollmentId), {
        progress: progress,
        status: progress === 100 ? 'completed' : 'in-progress',
        completed: progress === 100,
        ...(progress === 100 && { completedAt: new Date() })
      });
      
      if (progress === 100) {
        // Award achievement for course completion
        await addDoc(collection(db, 'userAchievements'), {
          userId: auth.currentUser.uid,
          title: 'Course Master',
          description: 'Completed a professional development course',
          type: 'course_completion',
          earnedAt: new Date(),
          points: 100
        });
      }
    } catch (error) {
      console.error('Error updating course progress:', error);
    }
  };

  const markSkillAsPracticed = async (skillId) => {
    try {
      await updateDoc(doc(db, 'userSkills', skillId), {
        lastPracticed: new Date(),
        proficiency: increment(0.1) // Small improvement
      });
    } catch (error) {
      console.error('Error updating skill practice:', error);
    }
  };

  // Student Profile Component
  const StudentProfileCard = () => (
    <Card sx={{ mb: 4, background: `linear-gradient(135deg, ${theme.palette.primary.main}20 0%, ${theme.palette.secondary.main}20 100%)` }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LocalLibraryIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Box>
            <Typography variant="h5" gutterBottom>Academic Profile</Typography>
            <Typography variant="body2" color="text.secondary">
              Your educational journey and career preparation
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} /> Education
              </Typography>
              {userProfile?.university ? (
                <Box>
                  <Typography variant="body1" fontWeight="medium">{userProfile.university}</Typography>
                  <Typography variant="body2" color="text.secondary">{userProfile.major}</Typography>
                  <Typography variant="body2">Graduation: {userProfile.graduationYear}</Typography>
                  <Chip 
                    label={userProfile.studentStatus || 'Student'} 
                    size="small" 
                    color="primary" 
                    sx={{ mt: 1 }}
                  />
                </Box>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Complete your academic profile to connect with campus opportunities
                </Alert>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessCenterIcon sx={{ mr: 1 }} /> Career Goals
              </Typography>
              <Typography variant="body2" paragraph>
                {userProfile?.careerGoals || 'Set your career goals to get personalized recommendations'}
              </Typography>
              <Button variant="outlined" size="small">
                Set Career Goals
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  const SkillCard = ({ skill }) => (
    <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom>{skill.name}</Typography>
            <Chip label={skill.category} size="small" color="primary" variant="outlined" />
          </Box>
          <Badge badgeContent={skill.endorsements?.length || 0} color="secondary">
            <ThumbUpIcon color="action" />
          </Badge>
        </Box>
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" gutterBottom sx={{ fontWeight: 'medium' }}>
            Proficiency Level
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Rating value={skill.proficiency} readOnly size="small" />
            <Typography variant="body2" color="text.secondary">
              {skill.proficiency}/5
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={(skill.proficiency / 5) * 100}
            sx={{ height: 6, borderRadius: 3 }}
          />
        </Box>

        {skill.lastPracticed && (
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Last practiced: {new Date(skill.lastPracticed?.toDate()).toLocaleDateString()}
          </Typography>
        )}
        
        <CardActions sx={{ px: 0 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<ThumbUpIcon />}
            onClick={() => endorseSkill(skill.id, skill.endorsements)}
          >
            Endorse
          </Button>
          <Button
            variant="text"
            size="small"
            onClick={() => markSkillAsPracticed(skill.id)}
          >
            Mark Practiced
          </Button>
        </CardActions>
      </CardContent>
    </Card>
  );

  const CourseCard = ({ course, enrollment }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" gutterBottom>{course.title}</Typography>
          <Chip label={course.level} size="small" color="primary" />
        </Box>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          by {course.instructor} • {course.duration}
        </Typography>
        <Typography variant="body2" paragraph sx={{ mb: 2 }}>
          {course.description}
        </Typography>
        
        {enrollment && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Progress: {enrollment.progress}%
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={enrollment.progress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              {[0, 25, 50, 75, 100].map(progress => (
                <Button
                  key={progress}
                  size="small"
                  variant={enrollment.progress === progress ? "contained" : "outlined"}
                  onClick={() => updateCourseProgress(enrollment.id, progress)}
                >
                  {progress}%
                </Button>
              ))}
            </Box>
          </Box>
        )}
      </CardContent>
      
      <CardActions sx={{ p: 2, pt: 0 }}>
        {enrollment ? (
          <Button variant="contained" fullWidth disabled={enrollment.progress === 100}>
            {enrollment.progress === 100 ? 'Completed ✓' : 'Continue Learning'}
          </Button>
        ) : (
          <Button variant="contained" fullWidth onClick={() => enrollCourse(course.id)}>
            Enroll Now
          </Button>
        )}
      </CardActions>
    </Card>
  );

  const AchievementCard = ({ achievement }) => (
    <Card sx={{ textAlign: 'center', height: '100%' }}>
      <CardContent>
        <Avatar sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          width: 60,
          height: 60,
          mx: 'auto',
          mb: 2
        }}>
          <EmojiEventsIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" gutterBottom>{achievement.title}</Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {achievement.description}
        </Typography>
        <Chip
          icon={<StarIcon />}
          label={`${achievement.points || 100} points`}
          color="primary"
          variant="outlined"
        />
        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
          Earned: {new Date(achievement.earnedAt?.toDate()).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );

  const progress = calculateOverallProgress();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Student Profile Header */}
      <StudentProfileCard />

      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, color: 'primary.main' }}>
          Professional Development
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Enhance your skills, track your progress, and advance your career
        </Typography>
        
        {/* Progress Overview */}
        <Paper sx={{ p: 3, mt: 3, background: `linear-gradient(135deg, ${theme.palette.primary.main}10 0%, ${theme.palette.secondary.main}10 100%)` }}>
          <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <TrendingUpIcon sx={{ mr: 1 }} /> Your Learning Journey
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary" fontWeight="bold">
                  {progress.overallProgress.toFixed(0)}%
                </Typography>
                <Typography variant="body2">Overall Progress</Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={progress.overallProgress} 
                  sx={{ height: 8, borderRadius: 4, mt: 1 }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="secondary" fontWeight="bold">
                  {skills.length}
                </Typography>
                <Typography variant="body2">Skills Mastered</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {enrollments.filter(e => e.progress === 100).length}
                </Typography>
                <Typography variant="body2">Courses Completed</Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 4 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            '& .MuiTab-root': {
              color: alpha('#fff', 0.7),
              fontWeight: 500,
              fontSize: '0.95rem',
              py: 2
            },
            '& .MuiTab-root.Mui-selected': {
              color: '#fff',
              fontWeight: 600
            }
          }}
        >
          <Tab icon={<PsychologyIcon />} label="Skills & Endorsements" />
          <Tab icon={<SchoolIcon />} label="Learning Courses" />
          <Tab icon={<EmojiEventsIcon />} label="Achievements" />
          <Tab icon={<TrendingUpIcon />} label="Career Growth" />
        </Tabs>

        <Box sx={{ p: 4 }}>
          {activeTab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h4">Your Skills Portfolio</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Showcase your expertise to employers and peers
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setShowAddSkill(true)}
                  sx={{ borderRadius: 2 }}
                >
                  Add Skill
                </Button>
              </Box>

              {skills.length > 0 ? (
                <Grid container spacing={3}>
                  {skills.map(skill => (
                    <Grid item xs={12} sm={6} md={4} key={skill.id}>
                      <SkillCard skill={skill} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                  <PsychologyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>No skills added yet</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Add your skills to showcase your expertise to other professionals
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setShowAddSkill(true)}
                    sx={{ mt: 2 }}
                  >
                    Add Your First Skill
                  </Button>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box>
                  <Typography variant="h4">Professional Development Courses</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Enhance your skills with curated learning paths
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setShowCourseForm(true)}
                >
                  Add Course
                </Button>
              </Box>

              {courses.length > 0 ? (
                <Grid container spacing={3}>
                  {courses.map(course => {
                    const enrollment = enrollments.find(e => e.courseId === course.id);
                    return (
                      <Grid item xs={12} md={6} lg={4} key={course.id}>
                        <CourseCard course={course} enrollment={enrollment} />
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                  <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>No courses available</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Check back later for professional development courses
                  </Typography>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 2 && (
            <Box>
              <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
                Your Achievements & Certifications
              </Typography>
              {achievements.length > 0 ? (
                <Grid container spacing={3}>
                  {achievements.map(achievement => (
                    <Grid item xs={12} sm={6} md={4} key={achievement.id}>
                      <AchievementCard achievement={achievement} />
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Paper sx={{ p: 6, textAlign: 'center' }}>
                  <EmojiEventsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom>No achievements yet</Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Complete courses and milestones to earn achievements
                  </Typography>
                  <Button variant="contained" onClick={() => setActiveTab(1)}>
                    Browse Courses
                  </Button>
                </Paper>
              )}
            </Box>
          )}

          {activeTab === 3 && (
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ mr: 1 }} /> Career Progress
                  </Typography>
                  
                  <Box sx={{ mb: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Profile Strength</Typography>
                      <Typography variant="body2" fontWeight="medium">75%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={75} sx={{ height: 10, borderRadius: 5, mb: 3 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Network Growth</Typography>
                      <Typography variant="body2" fontWeight="medium">60%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={60} sx={{ height: 10, borderRadius: 5, mb: 3 }} />
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Skill Development</Typography>
                      <Typography variant="body2" fontWeight="medium">85%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={85} sx={{ height: 10, borderRadius: 5 }} />
                  </Box>

                  <Stepper activeStep={2} orientation="vertical" sx={{ mt: 3 }}>
                    <Step>
                      <StepLabel>Complete Profile</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Add 5+ Skills</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Complete First Course</StepLabel>
                    </Step>
                    <Step>
                      <StepLabel>Connect with 10+ Professionals</StepLabel>
                    </Step>
                  </Stepper>
                </Paper>
              </Grid>

              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 4, borderRadius: 3 }}>
                  <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1 }} /> Career Recommendations
                  </Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Complete your academic profile" 
                        secondary="Add university, major, and graduation year" 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircleIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Develop in-demand skills" 
                        secondary="Focus on React, Node.js, and cloud technologies" 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><ScheduleIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Apply for internships" 
                        secondary="Look for opportunities in your field" 
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><GroupsIcon color="primary" /></ListItemIcon>
                      <ListItemText 
                        primary="Join student groups" 
                        secondary="Connect with peers and mentors" 
                      />
                    </ListItem>
                  </List>
                  <Button variant="contained" fullWidth sx={{ mt: 2 }}>
                    Generate Career Report
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      </Paper>

      {/* Add Skill Dialog */}
      <Dialog open={showAddSkill} onClose={() => setShowAddSkill(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Skill</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Skill Name"
            fullWidth
            value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })}
            sx={{ mb: 3 }}
          />
          <TextField
            select
            label="Category"
            fullWidth
            value={newSkill.category}
            onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}
            sx={{ mb: 3 }}
          >
            <MenuItem value="Technical">Technical</MenuItem>
            <MenuItem value="Soft Skills">Soft Skills</MenuItem>
            <MenuItem value="Business">Business</MenuItem>
            <MenuItem value="Creative">Creative</MenuItem>
            <MenuItem value="Academic">Academic</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </TextField>
          <Box>
            <Typography gutterBottom>Proficiency Level</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Rating
                value={newSkill.proficiency}
                onChange={(e, newValue) => setNewSkill({ ...newSkill, proficiency: newValue })}
                size="large"
              />
              <Typography variant="body2" color="text.secondary">
                {newSkill.proficiency}/5
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowAddSkill(false)}>Cancel</Button>
          <Button
            onClick={addSkill}
            variant="contained"
            disabled={!newSkill.name.trim()}
          >
            Add Skill
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Course Dialog */}
      <Dialog open={showCourseForm} onClose={() => setShowCourseForm(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add New Course</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Course Title"
            fullWidth
            value={newCourse.title}
            onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            multiline
            rows={3}
            fullWidth
            value={newCourse.description}
            onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Instructor"
                fullWidth
                value={newCourse.instructor}
                onChange={(e) => setNewCourse({ ...newCourse, instructor: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                margin="dense"
                label="Duration"
                fullWidth
                value={newCourse.duration}
                onChange={(e) => setNewCourse({ ...newCourse, duration: e.target.value })}
                placeholder="e.g., 4 weeks"
              />
            </Grid>
          </Grid>
          <Grid container spacing={2} sx={{ mt: 0 }}>
            <Grid item xs={6}>
              <TextField
                select
                margin="dense"
                label="Level"
                fullWidth
                value={newCourse.level}
                onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
              >
                <MenuItem value="Beginner">Beginner</MenuItem>
                <MenuItem value="Intermediate">Intermediate</MenuItem>
                <MenuItem value="Advanced">Advanced</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={6}>
              <TextField
                select
                margin="dense"
                label="Category"
                fullWidth
                value={newCourse.category}
                onChange={(e) => setNewCourse({ ...newCourse, category: e.target.value })}
              >
                <MenuItem value="Technical">Technical</MenuItem>
                <MenuItem value="Business">Business</MenuItem>
                <MenuItem value="Soft Skills">Soft Skills</MenuItem>
                <MenuItem value="Career Development">Career Development</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setShowCourseForm(false)}>Cancel</Button>
          <Button
            onClick={addCourse}
            variant="contained"
            disabled={!newCourse.title.trim() || !newCourse.description.trim()}
          >
            Add Course
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}