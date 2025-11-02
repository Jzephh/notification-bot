'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  Send as SendIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import AdminSetup from '@/components/AdminSetup';

interface User {
  id: string;
  username: string;
  name: string;
  avatarUrl?: string;
  roles: string[];
  isAdmin: boolean;
}

interface Role {
  _id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
}

interface Notification {
  id: string;
  roleName: string;
  message: string;
  sentBy: string;
  createdAt: string;
  isRead: boolean;
}

interface RoleRequest {
  _id: string;
  userId: string;
  username: string;
  roleName: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  handledBy?: string;
  handledAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Experience {
  id: string;
  name: string;
  type: string;
  company?: {
    id: string;
  };
}

interface NotificationSettings {
  experienceId: string;
  experienceName: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });

  // Dialog states
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false);
  const [requestRoleDialogOpen, setRequestRoleDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRoleForRequest, setSelectedRoleForRequest] = useState<Role | null>(null);

  // Form states
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('#1976d2');
  const [notificationMessage, setNotificationMessage] = useState('');

  // Role editing states
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editRoleColor, setEditRoleColor] = useState('#1976d2');

  // Admin tabs and Whop members
  const [adminTab, setAdminTab] = useState(0);
  const [whopMembers, setWhopMembers] = useState<(User & { email?: string })[]>([]);
  const [whopSearch, setWhopSearch] = useState('');
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRoles();
      fetchNotifications();
      fetchRoleRequests();
      if (user.isAdmin) {
        fetchUsers();
        fetchExperiences();
        fetchNotificationSettings();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        // Ensure roles array is clean and valid
        const cleanUser = {
          ...data.user,
          roles: Array.isArray(data.user.roles) ? data.user.roles.filter((role: string) => role && typeof role === 'string' && role.trim() !== '') : []
        };
        setUser(cleanUser);
      } else {
        setError('Failed to authenticate user');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles);
      } else {
        setError('Failed to fetch roles');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async (search = searchQuery, page = currentPage) => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      params.append('page', page.toString());
      params.append('limit', '10');
      
      const response = await fetch(`/api/users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setAllUsers(data.users);
        setPagination(data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 });
      } else {
        setError('Failed to fetch users');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications');
      if (response.ok) {
      const data = await response.json();
        setNotifications(data.notifications);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchWhopMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (whopSearch) params.append('search', whopSearch);
      const response = await fetch(`/api/admin/whop-users?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setWhopMembers(data.users || []);
      } else {
        setError('Failed to fetch Whop members');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleInviteUser = async (targetUserId?: string) => {
    const idToInvite = (targetUserId || inviteUserId).trim();
    if (!idToInvite) return;
    // Prevent inviting users that already exist in DB
    if (allUsers.some(u => u.id === idToInvite)) {
      setError('User already exists in database');
      return;
    }
    setInviting(true);
    try {
      const response = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: idToInvite })
      });
      if (response.ok) {
        setSuccess('Invitation sent');
        setInviteDialogOpen(false);
        setInviteUserId('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send invitation');
      }
    } catch {
      setError('Network error');
    } finally {
      setInviting(false);
    }
  };

  const fetchRoleRequests = async () => {
    try {
      const filter = user?.isAdmin ? 'all' : 'my';
      const response = await fetch(`/api/role-requests?filter=${filter}`);
      if (response.ok) {
        const data = await response.json();
        setRoleRequests(data.requests);
      } else {
        setError('Failed to fetch role requests');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchExperiences = async (filterType = 'chat') => {
    try {
      const response = await fetch(`/api/experiences?type=${filterType}`);
      if (response.ok) {
        const data = await response.json();
        setExperiences(data.experiences || []);
      } else {
        setError('Failed to fetch experiences');
      }
    } catch {
      setError('Network error');
    }
  };

  const fetchNotificationSettings = async () => {
    try {
      const response = await fetch('/api/notification-settings');
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.settings);
      } else {
        // Settings might not exist yet - this is OK
        setNotificationSettings(null);
      }
    } catch {
      setNotificationSettings(null);
    }
  };

  const handleSaveExperience = async (experienceId: string) => {
    const experience = experiences.find(exp => exp.id === experienceId);
    if (!experience) {
      setError('Invalid experience selected');
      return;
    }

    try {
      const response = await fetch('/api/notification-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          experienceId,
          experienceName: experience.name
        })
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.settings);
        setSuccess('Notification channel configured successfully');
      } else {
        setError('Failed to save settings');
      }
    } catch {
      setError('Network error');
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId,
          action: 'mark-read'
        })
      });

      if (response.ok) {
        // Update local state to mark as read
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, isRead: true }
              : notif
          )
        );
      }
    } catch {
      // Silently fail - don't show error for read status
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notificationId: 'all', // Special ID for mark-all-read
          action: 'mark-all-read'
        })
      });

      if (response.ok) {
        // Update local state to mark all as read
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, isRead: true }))
        );
        setSuccess('All notifications marked as read');
      }
    } catch {
      setError('Failed to mark all notifications as read');
    }
  };

  const handleCreateRole = async () => {
    try {
      const response = await fetch('/api/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoleName,
          description: newRoleDescription,
          color: newRoleColor
        })
      });

      if (response.ok) {
        setSuccess('Role created successfully!');
        setCreateRoleOpen(false);
        setNewRoleName('');
        setNewRoleDescription('');
        setNewRoleColor('#1976d2');
        fetchRoles();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleAssignRole = async (targetUserId: string, roleName: string, action: 'assign' | 'remove') => {
    try {
      const response = await fetch('/api/assign-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          roleName,
          action
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`${action === 'assign' ? 'Assigned' : 'Removed'} @${roleName} ${action === 'assign' ? 'to' : 'from'} ${data.user.name}`);
        fetchUsers(); // Refresh users list
        fetchUser(); // Refresh current user
      } else {
        const data = await response.json();
        setError(data.error || `Failed to ${action} role`);
      }
    } catch {
      setError('Network error');
    }
  };

  const handleRequestRole = async () => {
    if (!selectedRoleForRequest) return;

    try {
      const response = await fetch('/api/role-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: selectedRoleForRequest.name
        })
      });

      if (response.ok) {
        setSuccess(`Role @${selectedRoleForRequest.name} assigned successfully!`);
        setRequestRoleDialogOpen(false);
        setSelectedRoleForRequest(null);
        fetchUser(); // Refresh current user to show new role
        fetchUsers(); // Refresh users list if admin
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to assign role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description);
    setEditRoleColor(role.color);
  };

  const handleUpdateRole = async () => {
    if (!editingRole) return;

    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: editingRole._id,
          name: editRoleName,
          description: editRoleDescription,
          color: editRoleColor
        })
      });

      if (response.ok) {
        setSuccess('Role updated successfully!');
        setEditingRole(null);
        setEditRoleName('');
        setEditRoleDescription('');
        setEditRoleColor('#1976d2');
        fetchRoles();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This will remove it from all users.')) {
      return;
    }

    try {
      const response = await fetch(`/api/roles?roleId=${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Role deleted successfully!');
        fetchRoles();
        fetchUsers(); // Refresh users to show updated roles
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete role');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications?notificationId=${notificationId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccess('Notification deleted successfully!');
        fetchNotifications();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete notification');
      }
    } catch {
      setError('Network error');
    }
  };

  const handleSendNotification = async () => {
    if (!selectedRole || !notificationMessage.trim()) return;

    try {
      const response = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: selectedRole.name,
          message: notificationMessage
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(`Notification sent to ${data.notification.subscriberCount} subscribers!`);
        setNotifyDialogOpen(false);
        setNotificationMessage('');
        setSelectedRole(null);
        fetchNotifications(); // Refresh notifications for all users
      } else {
      const data = await response.json();
        setError(data.error || 'Failed to send notification');
      }
    } catch {
      setError('Network error');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
    );
  }

  if (error && !user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Box mt={4}>
          <AdminSetup />
        </Box>
      </Container>
    );
  }

  // Show admin setup only if user doesn't exist (first time setup)
  if (!user) {
    return <AdminSetup />;
  }

  return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box display="flex" alignItems="center" gap={2}>
          <NotificationsIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Typography variant="h3" component="h1" fontWeight="bold">
            Role Notifications
        </Typography>
      </Box>

      {user && (
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar src={user.avatarUrl} sx={{ width: 40, height: 40 }}>
              {user.name.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                @{user.username}
              </Typography>
            </Box>
            {user.isAdmin && (
              <Chip icon={<AdminIcon />} label="Admin" color="primary" size="small" />
            )}
          </Box>
        )}
      </Box>

      {/* User's Assigned Roles */}
      {user && user.roles && user.roles.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Assigned Roles
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              {user.roles.filter(role => role && role.trim() !== '').map((roleName) => (
                <Chip
                  key={roleName}
                  label={`@${roleName}`}
                  color="primary"
                  variant="outlined"
                  icon={<CheckIcon />}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You will receive notifications when these roles are mentioned.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Show message when user has no roles */}
      {user && (!user.roles || user.roles.length === 0) && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Your Assigned Roles
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You don&apos;t have any roles assigned. Request roles below.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Request Role Section */}
      {roles.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Get a Role
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select a role to get it assigned immediately. No approval needed.
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              {roles
                .filter(role => !user?.roles?.includes(role.name))
                .map((role) => (
                  <Button
                    key={role._id}
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setSelectedRoleForRequest(role);
                      setRequestRoleDialogOpen(true);
                    }}
                    sx={{ minWidth: 150 }}
                  >
                    Get @{role.name}
                  </Button>
                ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* User's Notifications */}
      {notifications.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom>
                Your Notifications
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <Chip
                    label={`${notifications.filter(n => !n.isRead).length} unread`}
                    color="error"
                    size="small"
                    sx={{ ml: 2 }}
                  />
                )}
              </Typography>
              {notifications.filter(n => !n.isRead).length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={markAllNotificationsAsRead}
                >
                  Mark All Read
                </Button>
              )}
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Notifications for roles you are assigned to:
          </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderLeft: notification.isRead ? 'none' : '4px solid',
                    borderLeftColor: 'primary.main',
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
            <Chip
                          label={`@${notification.roleName}`}
                          size="small"
              color="primary"
              variant="outlined"
            />
                        {!notification.isRead && (
                          <Chip
                            label="NEW"
                            size="small"
                            color="error"
                            variant="filled"
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(notification.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: notification.isRead ? 'normal' : 'bold'
                        }}
                      >
                        {notification.message}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {!notification.isRead && (
                        <IconButton
                          size="small"
                          onClick={() => markNotificationAsRead(notification.id)}
                          color="primary"
                          title="Mark as read"
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteNotification(notification.id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Card>
              ))}
        </Box>
          </CardContent>
        </Card>
      )}

      {/* Admin Tabs */}
      {user?.isAdmin && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Tabs
              value={adminTab}
              onChange={(_, v) => setAdminTab(v)}
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="Roles" />
              <Tab label="User Management" />
              <Tab label="Whop Members" />
              <Tab label="Settings" />
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Roles Grid (Admin Tab 0) */}
      {user?.isAdmin && adminTab === 0 ? (
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
        {roles.map((role) => (
          <Card key={role._id} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Chip
                  label={`@${role.name}`}
                  sx={{
                    backgroundColor: role.color,
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                />
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary">
                    Role
                  </Typography>
                  {user?.isAdmin && (
                    <>
                      <IconButton
                        size="small"
                        onClick={() => handleEditRole(role)}
                        color="primary"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteRole(role._id)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
      </Box>

              <Typography variant="body2" color="text.secondary" mb={2}>
                {role.description || 'No description'}
            </Typography>
            </CardContent>
          </Card>
            ))}
          </Box>
      ):(<></>)}

      {/* Notification Channel Configuration for Admins (Admin Tab 4) */}
      {user?.isAdmin && adminTab === 3 && experiences.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Notification Channel Configuration
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a chat channel where role notifications will be sent.
            </Typography>

            <Box display="flex" alignItems="center" gap={2}>
              <FormControl fullWidth>
                <InputLabel>Select Chat Channel</InputLabel>
                <Select
                  value={notificationSettings?.experienceId || ''}
                  onChange={(e) => handleSaveExperience(e.target.value)}
                  label="Select Chat Channel"
                >
                  {experiences.map((exp) => (
                    <MenuItem key={exp.id} value={exp.id}>
                      {exp.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {notificationSettings && (
                <Chip
                  label={`Configured: ${notificationSettings.experienceName}`}
                  color="success"
                  variant="outlined"
                />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* User Management Section for Admins (Admin Tab 2) */}
      {user?.isAdmin && adminTab === 1 && allUsers.length > 0 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" gutterBottom>
                User Management
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  fetchUsers();
                  fetchRoleRequests();
                }}
                startIcon={<RefreshIcon />}
              >
                Refresh Users
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Assign roles that users have requested. Users must submit a request before you can assign them a role.
            </Typography>

            {/* Search and Pagination Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
              <TextField
                placeholder="Search users by name or username..."
                size="small"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    fetchUsers(searchQuery, 1);
                  }
                }}
                sx={{ flexGrow: 1 }}
              />
              <Button
                variant="outlined"
                size="small"
                onClick={() => fetchUsers(searchQuery, currentPage)}
                startIcon={<RefreshIcon />}
              >
                Search
              </Button>
              {/* Invite is handled from Whop Members tab to ensure selecting non-local users */}
            </Box>

            {/* Pagination Info and Controls */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {allUsers.length} of {pagination.total} users
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                      fetchUsers(searchQuery, currentPage - 1);
                    }
                  }}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Typography variant="body2">
                  Page {pagination.page} of {pagination.totalPages}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    if (currentPage < pagination.totalPages) {
                      setCurrentPage(currentPage + 1);
                      fetchUsers(searchQuery, currentPage + 1);
                    }
                  }}
                  disabled={currentPage >= pagination.totalPages}
                >
                  Next
                </Button>
              </Box>
          </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Current Roles</TableCell>
                    <TableCell>Assign Roles</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {allUsers.map((targetUser) => (
                    <TableRow key={targetUser.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={targetUser.avatarUrl} sx={{ width: 32, height: 32 }}>
                            {targetUser.name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {targetUser.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{targetUser.username}
                </Typography>
                            {targetUser.isAdmin && (
                              <Chip label="Admin" size="small" color="primary" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {targetUser.roles && targetUser.roles.length > 0 && targetUser.roles.filter(role => role && role.trim() !== '').length > 0 ? (
                            targetUser.roles.filter(role => role && role.trim() !== '').map((roleName) => (
                              <Chip
                                key={roleName}
                                label={`@${roleName}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                                onDelete={() => handleAssignRole(targetUser.id, roleName, 'remove')}
                              />
                            ))
                          ) : (
                <Typography variant="body2" color="text.secondary">
                              No roles assigned
                </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {roles.length === 0 ? (
                            <Typography variant="body2" color="text.secondary">
                              No roles available
                            </Typography>
                          ) : (
                            roles.map((role) => (
                              <Tooltip key={role._id} title={`Assign @${role.name} to ${targetUser.name}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleAssignRole(targetUser.id, role.name, 'assign')}
                                  disabled={targetUser.roles && targetUser.roles.includes(role.name)}
                                  color={targetUser.roles && targetUser.roles.includes(role.name) ? "default" : "primary"}
                                >
                                  <Chip
                                    label={`@${role.name}`}
                                    size="small"
                                    color={targetUser.roles && targetUser.roles.includes(role.name) ? "default" : "primary"}
                                    variant={targetUser.roles && targetUser.roles.includes(role.name) ? "filled" : "outlined"}
                                  />
                                </IconButton>
                              </Tooltip>
                            ))
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
              </CardContent>
            </Card>
          )}


      {/* Create Role Button for Admins (visible on Roles tab) */}
      {user?.isAdmin && adminTab === 0 && (
        <Box display="flex" justifyContent="center" mt={4}>
              <Button
                variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateRoleOpen(true)}
          >
            Create New Role
              </Button>
        </Box>
      )}

      {/* Whop Members (Admin Tab 3) */}
      {user?.isAdmin && adminTab === 2 && (
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" gutterBottom>
                Whop Members
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={fetchWhopMembers}
                startIcon={<RefreshIcon />}
              >
                Refresh
              </Button>
            </Box>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                placeholder="Search by name, username, or email..."
                size="small"
                value={whopSearch}
                onChange={(e) => setWhopSearch(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') fetchWhopMembers();
                }}
                sx={{ flexGrow: 1 }}
              />
              <Button variant="outlined" size="small" onClick={fetchWhopMembers} startIcon={<RefreshIcon />}>Search</Button>
            </Box>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {whopMembers.map((wm) => {
                    const existsLocally = allUsers.some(u => u.id === wm.id);
                    return (
                    <TableRow key={wm.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar src={wm.avatarUrl} sx={{ width: 32, height: 32 }}>
                            {wm.name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">{wm.name}</Typography>
                            <Typography variant="caption" color="text.secondary">@{wm.username}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">{wm.email || '-'}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          disabled={existsLocally}
                          onClick={() => handleInviteUser(wm.id)}
                        >
                          {existsLocally ? 'Already in DB' : 'Invite'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );})}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Create Role Dialog */}
      <Dialog open={createRoleOpen} onClose={() => setCreateRoleOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Role</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={newRoleName}
            onChange={(e) => setNewRoleName(e.target.value)}
            placeholder="e.g., flips, green, yellow"
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newRoleDescription}
            onChange={(e) => setNewRoleDescription(e.target.value)}
            placeholder="Describe what this role is for..."
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            variant="outlined"
            value={newRoleColor}
            onChange={(e) => setNewRoleColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateRoleOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateRole} variant="contained">Create Role</Button>
        </DialogActions>
      </Dialog>

      {/* Notification Dialog */}
      <Dialog open={notifyDialogOpen} onClose={() => setNotifyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Send Notification to @{selectedRole?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            This will notify all users assigned to @{selectedRole?.name}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Message"
            fullWidth
            variant="outlined"
            multiline
            rows={4}
            value={notificationMessage}
            onChange={(e) => setNotificationMessage(e.target.value)}
            placeholder="Type your notification message here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNotifyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSendNotification}
            variant="contained"
            disabled={!notificationMessage.trim()}
          >
            Send Notification
          </Button>
        </DialogActions>
      </Dialog>

      {/* Invite User Dialog (accepts Whop userId) */}
      <Dialog open={inviteDialogOpen} onClose={() => setInviteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite User by Whop User ID</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Whop User ID"
            fullWidth
            variant="outlined"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            placeholder="user_XXXXXXXX"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleInviteUser()} variant="contained" disabled={inviting || !inviteUserId.trim() || allUsers.some(u => u.id === inviteUserId.trim())}>
            {inviting ? 'Sending...' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!editingRole} onClose={() => setEditingRole(null)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Edit Role: @{editingRole?.name}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Role Name"
            fullWidth
            variant="outlined"
            value={editRoleName}
            onChange={(e) => setEditRoleName(e.target.value)}
            placeholder="e.g., flips"
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={editRoleDescription}
            onChange={(e) => setEditRoleDescription(e.target.value)}
            placeholder="Describe what this role is for..."
          />
          <TextField
            margin="dense"
            label="Color"
            type="color"
            fullWidth
            variant="outlined"
            value={editRoleColor}
            onChange={(e) => setEditRoleColor(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingRole(null)}>Cancel</Button>
          <Button onClick={handleUpdateRole} variant="contained">Update Role</Button>
        </DialogActions>
      </Dialog>

      {/* Get Role Dialog */}
      <Dialog open={requestRoleDialogOpen} onClose={() => setRequestRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Get Role: @{selectedRoleForRequest?.name}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom sx={{ mt: 1 }}>
            You will receive the role <strong>@{selectedRoleForRequest?.name}</strong> immediately.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This role will be assigned to you right away.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestRoleDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRequestRole}
            variant="contained"
          >
            Get Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbars */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
      >
        <Alert onClose={() => setSuccess(null)} severity="success">
          {success}
        </Alert>
      </Snackbar>
      </Container>
  );
}