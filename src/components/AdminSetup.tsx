'use client';

import React, { useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { AdminPanelSettings as AdminIcon } from '@mui/icons-material';

export default function AdminSetup() {
  const [adminKey, setAdminKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSetup = async () => {
    if (!adminKey.trim()) {
      setError('Please enter the admin setup key');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminKey })
      });

      if (response.ok) {
        setSuccess('Admin privileges granted! You can now create roles and send notifications.');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to setup admin');
      }
    } catch (_error) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <AdminIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            Admin Setup
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Enter the admin setup key to gain admin privileges for this role notification system.
          </Typography>
          
          <TextField
            fullWidth
            label="Admin Setup Key"
            variant="outlined"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            sx={{ mb: 3 }}
            placeholder="Enter admin setup key"
          />
          
          <Button
            variant="contained"
            size="large"
            onClick={handleSetup}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AdminIcon />}
            fullWidth
          >
            {loading ? 'Setting up...' : 'Setup Admin'}
          </Button>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Contact your system administrator for the setup key.
          </Typography>
        </CardContent>
      </Card>

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
