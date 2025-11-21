import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Button,
  Chip,
  Alert
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import progressService from '../../../services/progressService';

const DetailedProgressSection = ({ studentId }) => {
  const [detailedProgress, setDetailedProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDetailedProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await progressService.getDetailedProgress(studentId);
      
      if (response.success) {
        setDetailedProgress(response.data);
      } else {
        setError(response.error || 'Failed to fetch detailed progress');
      }
    } catch (err) {
      console.error('Error fetching detailed progress:', err);
      setError('Failed to load detailed progress. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchDetailedProgress();
    }
  }, [studentId]);

  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}min`;
  };

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      return 'Unknown date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
        <Button 
          onClick={fetchDetailedProgress} 
          startIcon={<RefreshIcon />} 
          variant="outlined" 
          sx={{ mt: 2 }}
        >
          Retry
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Detailed Progress Tracking
        </Typography>
        <Button 
          onClick={fetchDetailedProgress} 
          startIcon={<RefreshIcon />} 
          size="small"
        >
          Refresh
        </Button>
      </Box>
      
      {detailedProgress.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Module</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Time Spent</TableCell>
                <TableCell>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {detailedProgress.map((progress, index) => (
                <TableRow 
                  key={progress._id || index} 
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {progress._id ? progress._id.substring(0, 8) : index + 1}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={progress.subject} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>{progress.module}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {progress.moduleProgress}%
                      </Typography>
                      <Box sx={{ width: 60, height: 6 }}>
                        <Box 
                          sx={{ 
                            width: `${progress.moduleProgress}%`, 
                            height: '100%', 
                            bgcolor: 'primary.main',
                            borderRadius: 1
                          }} 
                        />
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{formatTime(progress.timeSpent)}</TableCell>
                  <TableCell>{formatDate(progress.updatedAt || progress.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info">
          No detailed progress data available for this student.
        </Alert>
      )}
    </Box>
  );
};

export default DetailedProgressSection;