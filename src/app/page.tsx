"use client";
import { useEffect, useState } from 'react';
import { Button, Chip, Stack, TextField, Typography } from '@mui/material';

type Role = { _id: string; name: string; description?: string };

export default function Home() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [myRoles, setMyRoles] = useState<string[]>([]);
  const [newRole, setNewRole] = useState('');
  const [message, setMessage] = useState('@flips hello');

  async function fetchMyRoles() {
    const res = await fetch('/api/user-roles');
    if (res.ok) {
      const data = await res.json();
      setMyRoles(data.roles);
    }
  }

  async function fetchRoles() {
    const res = await fetch('/api/admin/roles');
    if (res.ok) {
      setRoles(await res.json());
    }
  }

  useEffect(() => {
    fetchRoles().catch(() => {});
    fetchMyRoles().catch(() => {});
  }, []);

  async function createRole() {
    const res = await fetch('/api/admin/roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRole }),
    });
    if (res.ok) {
      setNewRole('');
      fetchRoles();
    }
  }

  async function subscribe(roleName: string) {
    const res = await fetch('/api/user-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roleName }),
    });
    if (res.ok) fetchMyRoles();
  }

  async function unsubscribe(roleName: string) {
    const res = await fetch(`/api/user-roles?roleName=${encodeURIComponent(roleName)}`, {
      method: 'DELETE',
    });
    if (res.ok) fetchMyRoles();
  }

  async function testMention() {
    const res = await fetch('/api/webhooks/mentions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID, message }),
    });
    const data = await res.json();
    alert(`Would notify: ${data.recipients?.length ?? 0} users`);
  }

  return (
    <main className="max-w-3xl mx-auto p-6">
      <Typography variant="h5" gutterBottom>
        Role Notifications Demo
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField size="small" label="Create role" value={newRole} onChange={(e) => setNewRole(e.target.value)} />
        <Button variant="contained" onClick={createRole} disabled={!newRole.trim()}>
          Add Role
        </Button>
      </Stack>
      <Typography sx={{ mt: 3 }} variant="subtitle1">
        Available Roles
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {roles.map((r) => (
          <Chip key={r._id} label={`@${r.name}`} onClick={() => subscribe(r.name)} sx={{ m: 0.5 }} />
        ))}
      </Stack>
      <Typography sx={{ mt: 3 }} variant="subtitle1">
        My Roles
      </Typography>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        {myRoles.map((r) => (
          <Chip key={r} label={`@${r}`} onDelete={() => unsubscribe(r)} sx={{ m: 0.5 }} />
        ))}
      </Stack>
      <Typography sx={{ mt: 3 }} variant="subtitle1">
        Test @role Mention
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <TextField fullWidth size="small" value={message} onChange={(e) => setMessage(e.target.value)} />
        <Button variant="outlined" onClick={testMention}>Test</Button>
      </Stack>
    </main>
  );
}
