import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Chip,
  LinearProgress,
  Tooltip,
  Avatar
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon, 
  Add as AddIcon,
  School as SchoolIcon,
  EmojiEmotions as EmojiIcon,
  TrendingUp as ProgressIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const UsersSection = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: ''
  });
  const { api } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/analytics/dashboard-stats');
      setUsers(response.data.students || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: ''
      });
      setEditingUser(user._id);
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'student',
        password: ''
      });
      setEditingUser(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser}`, formData);
      } else {
        await api.post('/admin/users', formData);
      }
      fetchUsers();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/admin/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const getEmotionColor = (emotion) => {
    const colors = {
      happy: 'success',
      neutral: 'default',
      surprise: 'info',
      sad: 'warning',
      angry: 'error',
      fear: 'warning',
      disgust: 'error'
    };
    return colors[emotion] || 'default';
  };

  const getEmotionIcon = (emotion) => {
    const icons = {
      happy: '😊',
      neutral: '😐',
      surprise: '😲',
      sad: '😢',
      angry: '😠',
      fear: '😨',
      disgust: '🤢'
    };
    return icons[emotion] || '😐';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">User Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Progress</TableCell>
              <TableCell>Recent Emotions</TableCell>
              <TableCell>Subject Progress</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2 }}>
                      {user.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">{user.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {user.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Box width="100%">
                      <LinearProgress 
                        variant="determinate" 
                        value={user.progress || 0} 
                        color={user.progress > 70 ? 'success' : user.progress > 30 ? 'primary' : 'warning'}
                      />
                      <Typography variant="caption">
                        {user.progress || 0}% Complete
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  {user.recentEmotions && user.recentEmotions.length > 0 ? (
                    <Box>
                      {user.recentEmotions.slice(0, 3).map((emotionLog, index) => (
                        <Chip
                          key={index}
                          icon={<span>{getEmotionIcon(emotionLog.emotion)}</span>}
                          label={`${emotionLog.emotion} (${(emotionLog.confidence * 100).toFixed(0)}%)`}
                          color={getEmotionColor(emotionLog.emotion)}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No emotion data
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  {user.subjectProgress ? (
                    <Box>
                      {Object.entries(user.subjectProgress).slice(0, 2).map(([subject, progress]) => (
                        <Tooltip key={subject} title={`${subject}: ${progress.progress}%`}>
                          <Chip
                            icon={<SchoolIcon />}
                            label={`${subject}: ${progress.progress}%`}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        </Tooltip>
                      ))}
                      {Object.keys(user.subjectProgress).length > 2 && (
                        <Chip
                          label={`+${Object.keys(user.subjectProgress).length - 2} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      No subject data
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpenDialog(user)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(user._id)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          <DialogContent>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                label="Role"
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="student">Student</MenuItem>
              </Select>
            </FormControl>
            <TextField
              margin="normal"
              fullWidth
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              helperText={editingUser ? 'Leave blank to keep current password' : ''}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default UsersSection;