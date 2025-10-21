# Role Notification System

A Next.js application that provides role-based notification functionality integrated with Whop API. Users can create roles, subscribe to them, and receive notifications when those roles are pinged.

## Features

### 🎯 Role Management
- **Admin Interface**: Create and manage roles with custom names, descriptions, and colors
- **Role Subscription**: Users can subscribe/unsubscribe to roles with a single click
- **Real-time Updates**: Instant updates when roles are created or subscriptions change

### 🔔 Notification System
- **Role-based Pings**: Admins can send notifications to all subscribers of a specific role
- **Instant Delivery**: Notifications are sent immediately to all subscribed users
- **Notification History**: Track all sent notifications with timestamps

### 👥 User Management
- **Whop Integration**: Seamless authentication using Whop API
- **User Profiles**: Display user avatars, names, and subscription status
- **Admin Permissions**: Role-based access control for admin functions

### 🎨 Modern UI
- **Material-UI Design**: Beautiful, responsive interface using MUI components
- **Real-time Feedback**: Success/error messages with snackbar notifications
- **Intuitive Navigation**: Easy-to-use interface for all user types

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **UI Framework**: Material-UI (MUI)
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: Whop SDK integration
- **Styling**: Tailwind CSS + MUI

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create a `.env.local` file in the root directory with the following variables:

```env
# Whop API Credentials
WHOP_API_KEY=your_whop_api_key
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id

# Database Configuration
MONGO_URI=your_mongodb_connection_string
MONGO_DB=reaction_bot_db

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run the Development Server
```bash
npm run dev
```

### 4. Open Your Browser
Navigate to `http://localhost:3000`

## Database Schema

### User Model
```typescript
{
  companyId: string;
  userId: string;
  username: string;
  name: string;
  avatarUrl?: string;
  subscribedRoles: string[];
  isAdmin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Role Model
```typescript
{
  companyId: string;
  name: string;
  description?: string;
  color?: string;
  subscribers: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Notification Model
```typescript
{
  companyId: string;
  roleName: string;
  message: string;
  sentBy: string;
  sentTo: string[];
  createdAt: Date;
}
```

## API Endpoints

### Authentication
- `GET /api/auth/verify` - Verify user token with Whop

### Role Management
- `GET /api/roles` - Get all roles (admin only)
- `POST /api/roles` - Create new role (admin only)

### User Subscriptions
- `POST /api/subscribe` - Subscribe/unsubscribe to a role

### Notifications
- `POST /api/notify` - Send notification to role subscribers (admin only)

## Usage Guide

### For Admins
1. **Create Roles**: Click "Create New Role" button to add new roles like @flips, @green, @yellow
2. **Send Notifications**: Click "Notify" button on any role card to send messages to all subscribers
3. **Manage Users**: View user subscription status and manage role assignments

### For Users
1. **Subscribe to Roles**: Click "Subscribe" button on role cards to join notification lists
2. **View Subscriptions**: See all your subscribed roles in the "Your Subscribed Roles" section
3. **Unsubscribe**: Click on subscribed role chips to unsubscribe

## Role Creation Example

To create roles like @flips, @green, @yellow:

1. Login as admin
2. Click "Create New Role"
3. Enter role name (e.g., "flips")
4. Add description (optional)
5. Choose color
6. Click "Create Role"

## Notification Flow

1. Admin creates a role (e.g., @flips)
2. Users subscribe to the role by clicking "Subscribe"
3. Admin clicks "Notify" on the role card
4. Admin types a message and sends it
5. All subscribers receive the notification instantly

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy to your preferred platform (Vercel, Netlify, etc.)

3. Ensure environment variables are set in production

## Testing the System

1. **Create Test Roles**: Create roles like @flips, @green, @yellow
2. **Subscribe Users**: Have users subscribe to different roles
3. **Send Notifications**: Use admin account to ping roles and verify notifications
4. **Verify Delivery**: Check that subscribed users receive notifications

## Error Handling

The application includes comprehensive error handling for:
- Authentication failures
- Database connection issues
- Invalid role names
- Missing permissions
- Network errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.