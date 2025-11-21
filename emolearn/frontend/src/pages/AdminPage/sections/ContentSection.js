import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import adminApi from '../../../api/adminApi';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Checkbox,
  FormControlLabel,
  FormGroup,
  InputAdornment,
  Badge
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Category as CategoryIcon,
  Book as BookIcon,
  VideoLibrary as VideoIcon,
  Article as ArticleIcon,
  Quiz as QuizIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Publish as PublishIcon,
  Unpublished as UnpublishedIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Star as StarIcon,
  Save as SaveIcon
} from '@mui/icons-material';

// Form handling
const useFormik = (config) => {
  const [values, setValues] = React.useState(config.initialValues || {});
  const [errors, setErrors] = React.useState({});
  const [touched, setTouched] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched({
      ...touched,
      [name]: true
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);
    try {
      await config.onSubmit(values);
    } catch (error) {
      setErrors(error.errors || {});
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setFieldValue: (field, value) => {
      setValues({
        ...values,
        [field]: value
      });
    },
    setFieldTouched: (field, isTouched = true) => {
      setTouched({
        ...touched,
        [field]: isTouched
      });
    }
  };
};

// Simple validation
const Yup = {
  object: (schema) => ({
    validate: (values) => {
      const errors = {};
      Object.entries(schema).forEach(([key, validateFn]) => {
        if (validateFn.required && !values[key]) {
          errors[key] = 'This field is required';
        }
      });
      return errors;
    }
  }),
  string: () => ({
    required: (message) => ({
      required: true,
      message
    })
  })
};

const contentTypes = [
  { value: 'course', label: 'Course', icon: <BookIcon /> },
  { value: 'lesson', label: 'Lesson', icon: <ArticleIcon /> },
  { value: 'video', label: 'Video', icon: <VideoIcon /> },
  { value: 'quiz', label: 'Quiz', icon: <QuizIcon /> },
  { value: 'document', label: 'Document', icon: <ArticleIcon /> },
];

const statuses = [
  { value: 'draft', label: 'Draft', color: 'default' },
  { value: 'published', label: 'Published', color: 'success' },
  { value: 'archived', label: 'Archived', color: 'warning' },
];

const ContentSection = () => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState([]);
  const [filteredContent, setFilteredContent] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    category: 'all',
  });
  const [activeTab, setActiveTab] = useState('all');
  const [categories, setCategories] = useState([
    { id: 1, name: 'Mathematics' },
    { id: 2, name: 'Science' },
    { id: 3, name: 'History' },
    { id: 4, name: 'Literature' },
  ]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getContent();
      setContent(response.data);
      setFilteredContent(response.data);
    } catch (err) {
      setError('Failed to fetch content');
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let result = [...content];
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(term) || 
        item.description.toLowerCase().includes(term)
      );
    }
    
    // Apply filters
    if (filters.type !== 'all') {
      result = result.filter(item => item.type === filters.type);
    }
    
    if (filters.status !== 'all') {
      result = result.filter(item => item.status === filters.status);
    }
    
    if (filters.category !== 'all') {
      result = result.filter(item => item.category === filters.category);
    }
    
    // Apply tab filter
    if (activeTab !== 'all') {
      result = result.filter(item => item.status === activeTab);
    }
    
    setFilteredContent(result);
    setPage(0); // Reset to first page when filters change
  }, [content, searchTerm, filters, activeTab]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (item = null) => {
    setCurrentContent(item);
    if (item) {
      formik.setValues({
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        category: item.category,
        content: item.content || '',
        isFeatured: item.isFeatured || false,
        tags: item.tags?.join(', ') || '',
      });
    } else {
      formik.resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentContent(null);
  };

  const handleDeleteContent = async (id) => {
    if (window.confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      try {
        setLoading(true);
        await adminApi.deleteContent(id);
        setSuccess('Content deleted successfully');
        fetchContent();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to delete content');
        console.error('Error deleting content:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handlePublishToggle = async (id, currentStatus) => {
    try {
      setLoading(true);
      const newStatus = currentStatus === 'published' ? 'draft' : 'published';
      await adminApi.updateContent(id, { status: newStatus });
      setSuccess(`Content ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      fetchContent();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(`Failed to ${currentStatus === 'published' ? 'unpublish' : 'publish'} content`);
      console.error('Error updating content status:', err);
    } finally {
      setLoading(false);
    }
  };

  const formik = useFormik({
    initialValues: {
      title: '',
      description: '',
      type: 'course',
      status: 'draft',
      category: '',
      content: '',
      isFeatured: false,
      tags: '',
    },
    validationSchema: Yup.object({
      title: Yup.string().required('Title is required'),
      description: Yup.string().required('Description is required'),
      type: Yup.string().required('Content type is required'),
      status: Yup.string().required('Status is required'),
      category: Yup.string().required('Category is required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        const contentData = {
          ...values,
          tags: values.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        };

        if (currentContent) {
          await adminApi.updateContent(currentContent.id, contentData);
          setSuccess('Content updated successfully');
        } else {
          await adminApi.createContent(contentData);
          setSuccess('Content created successfully');
        }
        
        fetchContent();
        handleCloseDialog();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to save content');
        console.error('Error saving content:', err);
      } finally {
        setLoading(false);
      }
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'draft':
        return <PendingIcon color="action" fontSize="small" />;
      case 'archived':
        return <UnpublishedIcon color="disabled" fontSize="small" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    const typeInfo = contentTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : <CategoryIcon />;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
        <Typography variant="h5">Content Management</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchContent}
            sx={{ mr: 1 }}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={loading}
          >
            Add Content
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search content..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={8} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <TextField
              select
              size="small"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CategoryIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Types</MenuItem>
              {contentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.value} value={status.value}>
                  {status.label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => {/* Implement advanced filter dialog */}}
            >
              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<SortIcon />}
              onClick={() => {/* Implement sort dialog */}}
            >
              Sort
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All" value="all" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircleIcon fontSize="small" color="success" sx={{ mr: 0.5 }} />
                Published
              </Box>
            } 
            value="published" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PendingIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                Drafts
              </Box>
            } 
            value="draft" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <UnpublishedIcon fontSize="small" color="disabled" sx={{ mr: 0.5 }} />
                Archived
              </Box>
            } 
            value="archived" 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <StarIcon fontSize="small" color="warning" sx={{ mr: 0.5 }} />
                Featured
              </Box>
            } 
            value="featured" 
          />
        </Tabs>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Updated</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredContent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No content found. Create your first content item to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContent
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {item.isFeatured && (
                            <StarIcon color="warning" fontSize="small" sx={{ mr: 1 }} />
                          )}
                          <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                            {item.title}
                          </Typography>
                        </Box>
                        <Typography variant="caption" color="textSecondary">
                          {item.description.substring(0, 60)}...
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getTypeIcon(item.type)}
                          label={item.type}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.category}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(item.status)}
                          label={item.status}
                          size="small"
                          color={statuses.find(s => s.value === item.status)?.color || 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.updatedAt), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(item)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={item.status === 'published' ? 'Unpublish' : 'Publish'}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={() => handlePublishToggle(item.id, item.status)}
                              color={item.status === 'published' ? 'success' : 'default'}
                              disabled={item.status === 'archived'}
                            >
                              {item.status === 'published' ? 
                                <UnpublishedIcon fontSize="small" /> : 
                                <PublishIcon fontSize="small" />
                              }
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteContent(item.id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredContent.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Add/Edit Content Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        aria-labelledby="content-dialog-title"
      >
        <DialogTitle id="content-dialog-title">
          {currentContent ? 'Edit Content' : 'Add New Content'}
        </DialogTitle>
        <form onSubmit={formik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formik.values.title}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.title && Boolean(formik.errors.title)}
                  helperText={formik.touched.title && formik.errors.title}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formik.values.description}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.description && Boolean(formik.errors.description)}
                  helperText={formik.touched.description && formik.errors.description}
                  margin="normal"
                  multiline
                  rows={3}
                  required
                />
                <TextField
                  fullWidth
                  label="Content"
                  name="content"
                  value={formik.values.content}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  margin="normal"
                  multiline
                  rows={6}
                  placeholder="Enter your content here..."
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  select
                  fullWidth
                  label="Content Type"
                  name="type"
                  value={formik.values.type}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.type && Boolean(formik.errors.type)}
                  helperText={formik.touched.type && formik.errors.type}
                  margin="normal"
                  required
                >
                  {contentTypes.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {type.icon}
                        <Box component="span" sx={{ ml: 1 }}>{type.label}</Box>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Status"
                  name="status"
                  value={formik.values.status}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.status && Boolean(formik.errors.status)}
                  helperText={formik.touched.status && formik.errors.status}
                  margin="normal"
                  required
                >
                  {statuses.map((status) => (
                    <MenuItem key={status.value} value={status.value}>
                      <Chip
                        label={status.label}
                        size="small"
                        color={status.color}
                        variant="outlined"
                        sx={{ mr: 1 }}
                      />
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  name="category"
                  value={formik.values.category}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.category && Boolean(formik.errors.category)}
                  helperText={formik.touched.category && formik.errors.category}
                  margin="normal"
                  required
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.name}>
                      {category.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Tags"
                  name="tags"
                  value={formik.values.tags}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  margin="normal"
                  placeholder="tag1, tag2, tag3"
                  helperText="Separate tags with commas"
                />
                <FormGroup sx={{ mt: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formik.values.isFeatured}
                        onChange={formik.handleChange}
                        name="isFeatured"
                        color="primary"
                      />
                    }
                    label="Featured Content"
                  />
                </FormGroup>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleCloseDialog} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !formik.isValid}
              startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
            >
              {currentContent ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ContentSection;
