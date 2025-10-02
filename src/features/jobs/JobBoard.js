import { useState, useEffect } from 'react';
import { 
  collection, query, where, orderBy, onSnapshot, 
  addDoc, doc, updateDoc, arrayUnion, serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import {
  Box, Card, CardContent, Typography, Button, Chip, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, MenuItem,
  Grid, Avatar, Paper, Snackbar, Alert,
  LinearProgress, Divider, List, ListItem, ListItemText,
  InputAdornment, IconButton
} from '@mui/material';
import {
  Work as WorkIcon,
  Business as BusinessIcon,
  LocationOn as LocationOnIcon,
  AccessTime as AccessTimeIcon,
  Add as AddIcon,
  Search as SearchIcon,
  BookmarkBorder as BookmarkBorderIcon,
  Share as ShareIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { format, isAfter } from 'date-fns';

// Separate JobCard component to prevent re-rendering issues
const JobCard = ({ job, onApply, onSave }) => {
  // Safe date checking
  const getDeadlineDate = () => {
    if (!job.applicationDeadline) return null;
    try {
      return job.applicationDeadline?.toDate ? job.applicationDeadline.toDate() : new Date(job.applicationDeadline);
    } catch (error) {
      console.error('Error parsing deadline:', error);
      return null;
    }
  };

  const getCreatedDate = () => {
    if (!job.createdAt) return null;
    try {
      return job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt);
    } catch (error) {
      console.error('Error parsing creation date:', error);
      return null;
    }
  };

  const deadlineDate = getDeadlineDate();
  const createdDate = getCreatedDate();
  const expired = deadlineDate ? isAfter(new Date(), deadlineDate) : false;
  const isNew = createdDate && (new Date() - createdDate) < 7 * 24 * 60 * 60 * 1000;

  return (
    <Card sx={{ 
      mb: 2, 
      borderLeft: job.featured ? '4px solid #ffd700' : '4px solid transparent',
      opacity: expired ? 0.7 : 1
    }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              {job.title || 'Untitled Position'}
              {isNew && (
                <Chip label="NEW" size="small" color="success" sx={{ ml: 1 }} />
              )}
              {job.featured && (
                <Chip label="FEATURED" size="small" color="warning" sx={{ ml: 1 }} />
              )}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {job.company || 'Unknown Company'}
                </Typography>
              </Box>
              {job.location && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{job.location}</Typography>
                </Box>
              )}
              {job.type && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AccessTimeIcon sx={{ mr: 0.5, fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">{job.type}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton size="small" onClick={() => onSave(job.id)}>
              <BookmarkBorderIcon />
            </IconButton>
            <IconButton size="small">
              <ShareIcon />
            </IconButton>
          </Box>
        </Box>

        {job.description && (
          <Typography paragraph sx={{ 
            mb: 2, 
            display: '-webkit-box', 
            WebkitLineClamp: 3, 
            WebkitBoxOrient: 'vertical', 
            overflow: 'hidden' 
          }}>
            {job.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
          {job.category && (
            <Chip label={job.category} size="small" color="primary" variant="outlined" />
          )}
          {job.experience && (
            <Chip label={job.experience} size="small" />
          )}
          {job.salary && <Chip label={`${job.salary}`} size="small" color="success" />}
          {job.tags && job.tags.slice(0, 3).map((tag, index) => (
            <Chip key={index} label={tag} size="small" variant="outlined" />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              <PeopleIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
              {job.applicationCount || 0} applicants
            </Typography>
            {deadlineDate && (
              <Typography variant="body2" color={expired ? 'error' : 'text.secondary'}>
                <ScheduleIcon sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                {expired ? 'Expired' : `Apply by ${format(deadlineDate, 'MMM dd')}`}
              </Typography>
            )}
          </Box>

          <Button 
            variant="contained" 
            onClick={() => onApply(job)}
            disabled={expired}
          >
            {expired ? 'Expired' : 'Apply Now'}
          </Button>
        </Box>

        {job.postedByName && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={job.postedByPhoto} 
              sx={{ width: 24, height: 24, mr: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              Posted by {job.postedByName} • {createdDate ? format(createdDate, 'MMM dd') : 'Recently'}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showApplication, setShowApplication] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    category: '',
    experience: ''
  });

  // Form states
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    type: 'Full-time',
    category: 'Software Development',
    description: '',
    salary: '',
    experience: 'Entry Level',
    applicationDeadline: ''
  });

  const [applicationForm, setApplicationForm] = useState({
    coverLetter: '',
    resumeUrl: '',
    portfolioUrl: '',
    availability: 'Immediate',
    salaryExpectation: ''
  });

  // Load jobs with error handling
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      showMessage('Please log in to view jobs', 'info');
      return;
    }

    try {
      const jobsQuery = query(
        collection(db, 'jobs'), 
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(jobsQuery, 
        (snapshot) => {
          const jobsData = snapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data()
            // Keep as Firestore Timestamp for consistency
          }));
          
          console.log('Loaded jobs:', jobsData.length);
          setJobs(jobsData);
          setFilteredJobs(jobsData);
          setLoading(false);
        },
        (error) => {
          console.error('Firestore Error:', error);
          showMessage('Error loading jobs. Please check your connection.', 'error');
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Setup Error:', error);
      showMessage('Failed to initialize job board', 'error');
      setLoading(false);
    }
  }, []);

  // Filter jobs with better performance
  useEffect(() => {
    if (!jobs.length) {
      setFilteredJobs([]);
      return;
    }

    const filtered = jobs.filter(job => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        job.title?.toLowerCase().includes(searchLower) ||
        job.company?.toLowerCase().includes(searchLower) ||
        job.description?.toLowerCase().includes(searchLower) ||
        job.tags?.some(tag => tag.toLowerCase().includes(searchLower));

      const matchesType = !filters.type || job.type === filters.type;
      const matchesLocation = !filters.location || 
        job.location?.toLowerCase().includes(filters.location.toLowerCase());
      const matchesCategory = !filters.category || job.category === filters.category;
      const matchesExperience = !filters.experience || job.experience === filters.experience;

      return matchesSearch && matchesType && matchesLocation && matchesCategory && matchesExperience;
    });

    // Sort by featured and recent
    const sorted = [...filtered].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });

    setFilteredJobs(sorted);
  }, [jobs, searchTerm, filters]);

  const showMessage = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePostJob = async () => {
    if (!auth.currentUser) {
      showMessage('Please log in to post a job', 'error');
      return;
    }

    if (!jobForm.title || !jobForm.company || !jobForm.description) {
      showMessage('Please fill in all required fields', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'jobs'), {
        ...jobForm,
        postedBy: auth.currentUser.uid,
        postedByName: auth.currentUser.displayName,
        postedByPhoto: auth.currentUser.photoURL,
        createdAt: serverTimestamp(),
        applicants: [],
        status: 'active',
        views: 0,
        applicationCount: 0,
        featured: false
      });

      setJobForm({
        title: '', company: '', location: '', type: 'Full-time',
        category: 'Software Development', description: '', 
        salary: '', experience: 'Entry Level', applicationDeadline: ''
      });
      setShowJobForm(false);
      showMessage('Job posted successfully!');
    } catch (error) {
      console.error('Error posting job:', error);
      showMessage('Error posting job. Please try again.', 'error');
    }
  };

  const handleApplyForJob = async () => {
    if (!auth.currentUser) {
      showMessage('Please log in to apply for jobs', 'error');
      return;
    }

    if (!applicationForm.coverLetter) {
      showMessage('Please write a cover letter', 'error');
      return;
    }

    if (!selectedJob) {
      showMessage('No job selected', 'error');
      return;
    }

    try {
      // Create application document
      await addDoc(collection(db, 'applications'), {
        jobId: selectedJob.id,
        jobTitle: selectedJob.title,
        company: selectedJob.company,
        applicantId: auth.currentUser.uid,
        applicantName: auth.currentUser.displayName,
        applicantEmail: auth.currentUser.email,
        applicantPhoto: auth.currentUser.photoURL,
        coverLetter: applicationForm.coverLetter,
        resumeUrl: applicationForm.resumeUrl,
        portfolioUrl: applicationForm.portfolioUrl,
        availability: applicationForm.availability,
        salaryExpectation: applicationForm.salaryExpectation,
        appliedAt: serverTimestamp(),
        status: 'pending'
      });

      // Update job applications count
      await updateDoc(doc(db, 'jobs', selectedJob.id), {
        applicants: arrayUnion(auth.currentUser.uid),
        applicationCount: (selectedJob.applicationCount || 0) + 1
      });

      setApplicationForm({
        coverLetter: '', resumeUrl: '', portfolioUrl: '',
        availability: 'Immediate', salaryExpectation: ''
      });
      setShowApplication(false);
      setSelectedJob(null);
      showMessage('Application submitted successfully!');
    } catch (error) {
      console.error('Error applying for job:', error);
      showMessage('Error submitting application. Please try again.', 'error');
    }
  };

  const handleSaveJob = async (jobId) => {
    if (!auth.currentUser) {
      showMessage('Please log in to save jobs', 'error');
      return;
    }

    try {
      await addDoc(collection(db, 'savedJobs'), {
        userId: auth.currentUser.uid,
        jobId: jobId,
        savedAt: serverTimestamp()
      });
      showMessage('Job saved to your favorites');
    } catch (error) {
      console.error('Error saving job:', error);
      showMessage('Error saving job', 'error');
    }
  };

  const handleApplyClick = (job) => {
    if (!auth.currentUser) {
      showMessage('Please log in to apply for jobs', 'error');
      return;
    }
    setSelectedJob(job);
    setShowApplication(true);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2, textAlign: 'center' }}>Loading jobs...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          <WorkIcon sx={{ mr: 2, verticalAlign: 'bottom' }} />
          Job Board
          <Chip label={`${filteredJobs.length} jobs`} color="primary" sx={{ ml: 2 }} />
        </Typography>
        
        {auth.currentUser && (
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={() => setShowJobForm(true)}
            size="large"
          >
            Post a Job
          </Button>
        )}
      </Box>

      {/* Search and Filter Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search jobs by title, company, or keywords..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ mb: 3 }}
        />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Job Type"
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="Full-time">Full-time</MenuItem>
              <MenuItem value="Part-time">Part-time</MenuItem>
              <MenuItem value="Contract">Contract</MenuItem>
              <MenuItem value="Internship">Internship</MenuItem>
              <MenuItem value="Remote">Remote</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Category"
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <MenuItem value="">All Categories</MenuItem>
              <MenuItem value="Software Development">Software Development</MenuItem>
              <MenuItem value="Design">Design</MenuItem>
              <MenuItem value="Marketing">Marketing</MenuItem>
              <MenuItem value="Business">Business</MenuItem>
              <MenuItem value="Education">Education</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              select
              fullWidth
              label="Experience"
              value={filters.experience}
              onChange={(e) => setFilters({...filters, experience: e.target.value})}
            >
              <MenuItem value="">Any Experience</MenuItem>
              <MenuItem value="Entry Level">Entry Level</MenuItem>
              <MenuItem value="Mid Level">Mid Level</MenuItem>
              <MenuItem value="Senior Level">Senior Level</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Location"
              placeholder="City or remote"
              value={filters.location}
              onChange={(e) => setFilters({...filters, location: e.target.value})}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Jobs List */}
      <Grid container spacing={4}>
        <Grid item xs={12} lg={8}>
          {filteredJobs.length === 0 ? (
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <WorkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h5" gutterBottom color="text.secondary">
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'No jobs match your search criteria' 
                  : 'No jobs available yet'
                }
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm || Object.values(filters).some(f => f) 
                  ? 'Try adjusting your filters or search terms' 
                  : 'Be the first to post a job opportunity'
                }
              </Typography>
              {auth.currentUser && !searchTerm && !Object.values(filters).some(f => f) && (
                <Button variant="contained" onClick={() => setShowJobForm(true)} size="large">
                  Post the First Job
                </Button>
              )}
            </Paper>
          ) : (
            <Box>
              {filteredJobs.map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onApply={handleApplyClick}
                  onSave={handleSaveJob}
                />
              ))}
            </Box>
          )}
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, position: 'sticky', top: 100 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Job Statistics
            </Typography>
            <List>
              <ListItem>
                <ListItemText 
                  primary="Total Active Jobs" 
                  secondary={jobs.length}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Total Applications" 
                  secondary={jobs.reduce((acc, job) => acc + (job.applicationCount || 0), 0)}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Featured Jobs" 
                  secondary={jobs.filter(job => job.featured).length}
                />
              </ListItem>
            </List>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Quick Actions
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button variant="outlined" startIcon={<BookmarkBorderIcon />}>
                View Saved Jobs
              </Button>
              <Button variant="outlined">
                Career Resources
              </Button>
              <Button variant="outlined">
                Resume Builder
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Job Posting Dialog */}
      <Dialog open={showJobForm} onClose={() => setShowJobForm(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Post a New Job Opportunity</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Job Title *"
                fullWidth
                value={jobForm.title}
                onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Company *"
                fullWidth
                value={jobForm.company}
                onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location *"
                fullWidth
                value={jobForm.location}
                onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Job Type *"
                fullWidth
                value={jobForm.type}
                onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Job Description *"
                multiline
                rows={4}
                fullWidth
                value={jobForm.description}
                onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Salary Range"
                fullWidth
                value={jobForm.salary}
                onChange={(e) => setJobForm({...jobForm, salary: e.target.value})}
                placeholder="e.g., $50,000 - $70,000"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Application Deadline"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={jobForm.applicationDeadline}
                onChange={(e) => setJobForm({...jobForm, applicationDeadline: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJobForm(false)}>Cancel</Button>
          <Button onClick={handlePostJob} variant="contained" size="large">
            Post Job
          </Button>
        </DialogActions>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={showApplication} onClose={() => setShowApplication(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Apply for {selectedJob?.title}
          <Typography variant="body2" color="text.secondary">
            at {selectedJob?.company} • {selectedJob?.location}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Cover Letter *"
            multiline
            rows={6}
            fullWidth
            value={applicationForm.coverLetter}
            onChange={(e) => setApplicationForm({...applicationForm, coverLetter: e.target.value})}
            placeholder="Why are you interested in this position? What skills and experience make you a good fit?"
            sx={{ mb: 2 }}
            required
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Resume URL"
                fullWidth
                value={applicationForm.resumeUrl}
                onChange={(e) => setApplicationForm({...applicationForm, resumeUrl: e.target.value})}
                placeholder="Link to your resume"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Portfolio URL"
                fullWidth
                value={applicationForm.portfolioUrl}
                onChange={(e) => setApplicationForm({...applicationForm, portfolioUrl: e.target.value})}
                placeholder="Link to your portfolio"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApplication(false)}>Cancel</Button>
          <Button onClick={handleApplyForJob} variant="contained" size="large">
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
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