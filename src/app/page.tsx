'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Tooltip
} from '@mui/material';
import { Tabs, Tab } from '@mui/material';
import {
  Add as AddIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  CheckCircle as CheckIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import AdminSetup from '@/components/AdminSetup';
import { useTheme } from '@/contexts/ThemeContext';
import { getContrastTextColor, darkenColor, lightenColor } from '@/lib/colorUtils';

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


export default function HomePage() {
  const { mode, toggleMode } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
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
      if (user.isAdmin) {
        fetchUsers();
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

  const handleRemoveRole = async (roleName: string) => {
    try {
      const response = await fetch('/api/user/remove-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName
        })
      });

      if (response.ok) {
        setSuccess(`Role @${roleName} removed successfully!`);
        fetchUser(); // Refresh current user to remove role from display
        fetchUsers(); // Refresh users list if admin
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to remove role');
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
    <Box
      sx={{
        minHeight: '100vh',
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #2d1b69 100%)'
          : 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: mode === 'dark'
            ? `
              radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 40% 40%, rgba(236, 72, 153, 0.05) 0%, transparent 50%)
            `
            : 'none',
          zIndex: 0,
          animation: 'backgroundFloat 20s ease-in-out infinite',
          '@keyframes backgroundFloat': {
            '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
            '33%': { transform: 'translateY(-20px) rotate(1deg)' },
            '66%': { transform: 'translateY(10px) rotate(-1deg)' },
          },
        },
      }}
    >
      <Container maxWidth="lg" sx={{ py: 4, minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8,
            type: "spring",
            stiffness: 100,
            damping: 20
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Box display="flex" alignItems="center" gap={2}>
              <motion.div
                whileHover={{ scale: 1.1, rotate: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <NotificationsIcon sx={{ 
                  fontSize: 40, 
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
                    : 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }} />
              </motion.div>
              <Typography 
                variant="h3" 
                component="h1" 
                fontWeight="bold"
                sx={{
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
                    : 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Role Notifications
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton onClick={toggleMode} color="inherit">
                    {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </motion.div>
              </Tooltip>

              {user && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <Avatar 
                      src={user.avatarUrl} 
                      sx={{ 
                        width: 40, 
                        height: 40,
                        border: `2px solid ${mode === 'dark' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(25, 118, 210, 0.5)'}`,
                        boxShadow: mode === 'dark' 
                          ? '0 0 15px rgba(99, 102, 241, 0.3)'
                          : '0 0 15px rgba(25, 118, 210, 0.3)',
                      }}
                    >
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
                      <Chip 
                        icon={<AdminIcon />} 
                        label="Admin" 
                        color="primary" 
                        size="small"
                        sx={{
                          background: mode === 'dark'
                            ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
                            : undefined,
                        }}
                      />
                    )}
                  </Box>
                </motion.div>
              )}
            </Box>
          </Box>
        </motion.div>

        {/* User's Assigned Roles */}
        <AnimatePresence mode="wait">
          {user && user.roles && user.roles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
            >
              <Card 
                sx={{ 
                  mb: 4,
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%)'
                    : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(220, 0, 78, 0.03) 100%)',
                  border: mode === 'dark'
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid rgba(25, 118, 210, 0.2)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Your Assigned Roles
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1.5} mb={2}>
                    {user.roles.filter(role => role && role.trim() !== '').map((roleName) => {
                      const roleColor = roles.find(r => r.name === roleName)?.color;
                      return (
                        <motion.div
                          key={roleName}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Chip
                            label={`@${roleName}`}
                            icon={<CheckIcon />}
                            onDelete={() => handleRemoveRole(roleName)}
                            deleteIcon={
                              <motion.div
                                whileHover={{ scale: 1.2, rotate: 90 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <DeleteIcon 
                                  sx={{ 
                                    fontSize: '1rem',
                                    color: roleColor ? getContrastTextColor(roleColor) : 'inherit',
                                  }} 
                                />
                              </motion.div>
                            }
                            sx={{
                              backgroundColor: roleColor || (mode === 'dark' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(25, 118, 210, 0.1)'),
                              color: roleColor ? getContrastTextColor(roleColor) : 'inherit',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                              border: roleColor ? `2px solid ${roleColor}` : undefined,
                              boxShadow: roleColor 
                                ? `0 2px 8px ${roleColor}30, 0 1px 3px rgba(0, 0, 0, 0.1)`
                                : '0 1px 3px rgba(0, 0, 0, 0.1)',
                              cursor: 'pointer',
                              '& .MuiChip-icon': {
                                color: roleColor ? getContrastTextColor(roleColor) : 'inherit',
                              },
                              '& .MuiChip-deleteIcon': {
                                transition: 'all 0.2s',
                                '&:hover': {
                                  color: mode === 'dark' ? '#ef4444' : '#dc2626',
                                },
                              },
                            }}
                          />
                        </motion.div>
                      );
                    })}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    You will receive notifications when these roles are mentioned.
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Show message when user has no roles */}
        <AnimatePresence mode="wait">
          {user && (!user.roles || user.roles.length === 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card 
                sx={{ 
                  mb: 4,
                  background: mode === 'dark'
                    ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(236, 72, 153, 0.02) 100%)'
                    : 'linear-gradient(135deg, rgba(25, 118, 210, 0.03) 0%, rgba(220, 0, 78, 0.01) 100%)',
                  border: mode === 'dark'
                    ? '1px solid rgba(99, 102, 241, 0.2)'
                    : '1px solid rgba(25, 118, 210, 0.15)',
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom fontWeight={600}>
                    Your Assigned Roles
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    You don&apos;t have any roles assigned. Request roles below.
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Request Role Section */}
        <AnimatePresence mode="wait">
          {roles.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
            >
              <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Get a Role
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select a role to get it assigned immediately. No approval needed.
            </Typography>
            <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(280px, 1fr))" gap={2}>
              {roles
                .filter(role => !user?.roles?.includes(role.name))
                .map((role, index) => (
                  <motion.div
                    key={role._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card 
                      variant="outlined"
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        border: mode === 'dark' 
                          ? '1px solid rgba(99, 102, 241, 0.2)' 
                          : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: mode === 'dark'
                          ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
                          : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${role.color}, ${lightenColor(role.color, 20)})`,
                          opacity: 0,
                          transition: 'opacity 0.3s',
                        },
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: mode === 'dark'
                            ? `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${role.color}40, 0 0 20px ${role.color}20`
                            : `0 8px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px ${role.color}30`,
                          '&::before': {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Chip
                          label={`@${role.name}`}
                          sx={{
                            backgroundColor: role.color,
                            color: getContrastTextColor(role.color),
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            height: '32px',
                            border: `2px solid ${role.color}`,
                            boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px ${darkenColor(role.color, 20)}`,
                            '& .MuiChip-label': {
                              px: 1.5,
                              fontWeight: 700,
                            },
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ 
                          mb: 2, 
                          minHeight: 48,
                          lineHeight: 1.6,
                          fontSize: '0.9rem',
                        }}
                      >
                        {role.description || 'No description available'}
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSelectedRoleForRequest(role);
                          setRequestRoleDialogOpen(true);
                        }}
                        fullWidth
                        sx={{
                          backgroundColor: role.color,
                          color: getContrastTextColor(role.color),
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          textTransform: 'none',
                          borderRadius: '8px',
                          py: 1.2,
                          boxShadow: `0 4px 12px ${role.color}40, 0 2px 4px rgba(0, 0, 0, 0.1)`,
                          border: `1px solid ${darkenColor(role.color, 15)}`,
                          '&:hover': {
                            backgroundColor: darkenColor(role.color, 10),
                            boxShadow: `0 6px 16px ${role.color}60, 0 4px 8px rgba(0, 0, 0, 0.15)`,
                            transform: 'translateY(-1px)',
                          },
                          transition: 'all 0.2s ease-in-out',
                        }}
                      >
                        Get Role
                      </Button>
                    </CardContent>
                  </Card>
                  </motion.div>
                ))}
            </Box>
          </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2.5,
                      borderLeft: notification.isRead ? '2px solid transparent' : '4px solid',
                      borderLeftColor: notification.isRead ? 'transparent' : mode === 'dark' ? '#6366f1' : '#1976d2',
                      backgroundColor: notification.isRead 
                        ? 'transparent' 
                        : mode === 'dark'
                          ? 'rgba(99, 102, 241, 0.1)'
                          : 'rgba(25, 118, 210, 0.05)',
                      borderRadius: '12px',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateX(4px)',
                        boxShadow: mode === 'dark'
                          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                      },
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
                </motion.div>
              ))}
        </Box>
          </CardContent>
        </Card>
      )}

        {/* Admin Tabs */}
        <AnimatePresence mode="wait">
          {user?.isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.3 }}
            >
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
                  </Tabs>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roles Grid (Admin Tab 0) */}
        <AnimatePresence mode="wait">
          {user?.isAdmin && adminTab === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
            >
              <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
                {roles.map((role, index) => (
                  <motion.div
                    key={role._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -4 }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        border: mode === 'dark' 
                          ? '1px solid rgba(99, 102, 241, 0.2)' 
                          : '1px solid rgba(0, 0, 0, 0.08)',
                        boxShadow: mode === 'dark'
                          ? '0 4px 6px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.2)'
                          : '0 2px 4px rgba(0, 0, 0, 0.1)',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, ${role.color}, ${lightenColor(role.color, 20)})`,
                        },
                        '&:hover': {
                          boxShadow: mode === 'dark'
                            ? `0 12px 24px rgba(0, 0, 0, 0.4), 0 0 0 1px ${role.color}40, 0 0 20px ${role.color}20`
                            : `0 8px 16px rgba(0, 0, 0, 0.15), 0 0 0 1px ${role.color}30`,
                        },
                      }}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Chip
                            label={`@${role.name}`}
                            sx={{
                              backgroundColor: role.color,
                              color: getContrastTextColor(role.color),
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              height: '32px',
                              border: `2px solid ${role.color}`,
                              boxShadow: `0 2px 8px rgba(0, 0, 0, 0.15), 0 0 0 1px ${darkenColor(role.color, 20)}`,
                              '& .MuiChip-label': {
                                px: 1.5,
                                fontWeight: 700,
                              },
                            }}
                          />
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              Role
                            </Typography>
                            {user?.isAdmin && (
                              <>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditRole(role)}
                                  sx={{
                                    color: 'primary.main',
                                    '&:hover': {
                                      backgroundColor: 'primary.main',
                                      color: 'white',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteRole(role._id)}
                                  sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                      backgroundColor: 'error.main',
                                      color: 'white',
                                      transform: 'scale(1.1)',
                                    },
                                    transition: 'all 0.2s',
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </>
                            )}
                          </Box>
                        </Box>

                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        mb={2}
                        sx={{
                          lineHeight: 1.6,
                          fontSize: '0.9rem',
                          minHeight: 40,
                        }}
                      >
                        {role.description || 'No description'}
                      </Typography>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>


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
                }}
                startIcon={<RefreshIcon />}
              >
                Refresh Users
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Assign or remove roles for users in your company.
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
        <AnimatePresence mode="wait">
          {user?.isAdmin && adminTab === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Box display="flex" justifyContent="center" mt={4}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={() => setCreateRoleOpen(true)}
                    sx={{
                      background: mode === 'dark'
                        ? 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)'
                        : 'linear-gradient(135deg, #1976d2 0%, #dc004e 100%)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: '1rem',
                      textTransform: 'none',
                      borderRadius: '12px',
                      px: 4,
                      py: 1.5,
                      boxShadow: mode === 'dark'
                        ? '0 8px 16px rgba(99, 102, 241, 0.4), 0 4px 8px rgba(236, 72, 153, 0.3)'
                        : '0 4px 12px rgba(25, 118, 210, 0.4)',
                      '&:hover': {
                        background: mode === 'dark'
                          ? 'linear-gradient(135deg, #4f46e5 0%, #db2777 100%)'
                          : 'linear-gradient(135deg, #1565c0 0%, #c51162 100%)',
                        boxShadow: mode === 'dark'
                          ? '0 12px 24px rgba(99, 102, 241, 0.5), 0 6px 12px rgba(236, 72, 153, 0.4)'
                          : '0 6px 16px rgba(25, 118, 210, 0.5)',
                      },
                      transition: 'all 0.3s ease-in-out',
                    }}
                  >
                    Create New Role
                  </Button>
                </motion.div>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Whop Members (Admin Tab 2) */}
        <AnimatePresence mode="wait">
          {user?.isAdmin && adminTab === 2 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card sx={{ mt: 4 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h5" gutterBottom fontWeight={600}>
                      Whop Members
                    </Typography>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={fetchWhopMembers}
                        startIcon={<RefreshIcon />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        Refresh
                      </Button>
                    </motion.div>
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
                      sx={{ 
                        flexGrow: 1,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                      }}
                    />
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={fetchWhopMembers} 
                        startIcon={<RefreshIcon />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 500,
                        }}
                      >
                        Search
                      </Button>
                    </motion.div>
                  </Box>
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: 400,
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}
                  >
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {whopMembers.map((wm, index) => {
                          const existsLocally = allUsers.some(u => u.id === wm.id);
                          return (
                            <TableRow
                              key={wm.id}
                              sx={{
                                opacity: 0,
                                animation: `fadeIn 0.3s ease-in-out ${index * 0.03}s forwards`,
                                '&:hover': {
                                  backgroundColor: mode === 'dark'
                                    ? 'rgba(99, 102, 241, 0.05)'
                                    : 'rgba(25, 118, 210, 0.03)',
                                },
                                '@keyframes fadeIn': {
                                  to: { opacity: 1 },
                                },
                              }}
                            >
                                <TableCell>
                                  <Box display="flex" alignItems="center" gap={2}>
                                    <Avatar 
                                      src={wm.avatarUrl} 
                                      sx={{ 
                                        width: 40, 
                                        height: 40,
                                        border: `2px solid ${mode === 'dark' ? 'rgba(99, 102, 241, 0.3)' : 'rgba(25, 118, 210, 0.3)'}`,
                                      }}
                                    >
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
                                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      disabled={existsLocally}
                                      onClick={() => handleInviteUser(wm.id)}
                                      sx={{
                                        borderRadius: '8px',
                                        textTransform: 'none',
                                        fontWeight: 500,
                                        opacity: existsLocally ? 0.5 : 1,
                                      }}
                                    >
                                      {existsLocally ? 'Already in DB' : 'Invite'}
                                    </Button>
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

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
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Chip
              label={`@${selectedRoleForRequest?.name}`}
              sx={{
                backgroundColor: selectedRoleForRequest?.color || '#1976d2',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.875rem'
              }}
            />
          </Box>
          {selectedRoleForRequest?.description && (
            <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
              <strong>Description:</strong>
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {selectedRoleForRequest?.description || 'No description available'}
          </Typography>
          <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
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
            sx={{
              backgroundColor: selectedRoleForRequest?.color || '#1976d2',
              color: getContrastTextColor(selectedRoleForRequest?.color || '#1976d2'),
              fontWeight: 600,
              fontSize: '0.875rem',
              textTransform: 'none',
              borderRadius: '8px',
              py: 1.2,
              boxShadow: `0 4px 12px ${(selectedRoleForRequest?.color || '#1976d2')}40, 0 2px 4px rgba(0, 0, 0, 0.1)`,
              border: `1px solid ${darkenColor(selectedRoleForRequest?.color || '#1976d2', 15)}`,
              '&:hover': {
                backgroundColor: darkenColor(selectedRoleForRequest?.color || '#1976d2', 10),
                boxShadow: `0 6px 16px ${(selectedRoleForRequest?.color || '#1976d2')}60, 0 4px 8px rgba(0, 0, 0, 0.15)`,
                transform: 'translateY(-1px)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
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
    </Box>
  );
}