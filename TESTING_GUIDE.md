# Role Notification System - Testing Guide

## Quick Setup Instructions

### 1. Environment Setup
Create a `.env.local` file in the root directory with your Whop credentials:

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

### 2. Start the Application
```bash
npm run dev
```

### 3. Initial Admin Setup
1. Open `http://localhost:3000`
2. You'll see the Admin Setup page
3. Enter the admin setup key: `admin-setup-key-2024`
4. Click "Setup Admin"
5. You'll be redirected to the main interface

## Testing the Role Notification System

### Step 1: Create Roles
As an admin, you can create roles like @flips, @green, @yellow:

1. Click "Create New Role" button
2. Enter role name: `flips`
3. Add description: `For flip traders`
4. Choose a color (e.g., blue)
5. Click "Create Role"
6. Repeat for `green` and `yellow` roles

### Step 2: Subscribe to Roles
1. On each role card, click "Subscribe"
2. The button will change to "Subscribed" with a checkmark
3. You'll see the role appear in "Your Subscribed Roles" section

### Step 3: Send Notifications
1. Click "Notify" button on any role card
2. Type a message: "Hey @flips! New trading opportunity available!"
3. Click "Send Notification"
4. You'll see a success message showing how many subscribers were notified

### Step 4: Test Role Pings
The system is designed to work with external role pings. When someone types `@flips` in your Whop community:

1. The system detects the role mention
2. Finds all subscribers to that role
3. Sends notifications to all subscribed users
4. Users receive instant notifications

## Key Features Tested

### ✅ Role Management
- Create roles with custom names, descriptions, and colors
- View all created roles in a responsive grid
- Admin-only access to role creation

### ✅ User Subscription
- Subscribe/unsubscribe to roles with one click
- Visual feedback showing subscription status
- Track subscriber count for each role

### ✅ Notification System
- Send notifications to all role subscribers
- Real-time feedback on notification delivery
- Track notification history

### ✅ Admin Controls
- Admin setup with secure key
- Role-based access control
- User management and permissions

## API Endpoints Available

- `GET /api/auth/verify` - User authentication
- `GET /api/roles` - Get all roles (admin only)
- `POST /api/roles` - Create new role (admin only)
- `POST /api/subscribe` - Subscribe/unsubscribe to role
- `POST /api/notify` - Send notification to role subscribers (admin only)
- `POST /api/admin/setup` - Setup admin privileges

## Database Collections

The system creates three MongoDB collections:

1. **users** - User profiles and subscription data
2. **roles** - Role definitions and subscriber lists
3. **notifications** - Notification history and delivery tracking

## Integration with Whop

The system integrates seamlessly with Whop:

1. **Authentication**: Uses Whop SDK for user verification
2. **User Data**: Fetches user profiles from Whop API
3. **Permissions**: Respects Whop's user management system
4. **Community Integration**: Designed to work within Whop communities

## Testing Scenarios

### Scenario 1: New User Flow
1. New user joins your Whop community
2. User visits the role notification app
3. User subscribes to relevant roles (@flips, @green, @yellow)
4. Admin sends notifications to these roles
5. User receives notifications instantly

### Scenario 2: Role Management
1. Admin creates new role @premium
2. Users subscribe to @premium
3. Admin sends exclusive notifications to @premium subscribers
4. Only premium subscribers receive the notifications

### Scenario 3: External Role Pings
1. Someone types `@flips` in your Whop community chat
2. The system detects the role mention
3. All @flips subscribers receive notifications
4. Users can respond or take action based on the notification

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check Whop API credentials in .env.local
2. **Database Connection**: Verify MongoDB connection string
3. **Admin Setup**: Use the correct admin setup key
4. **Role Creation**: Ensure role names are unique and valid

### Debug Mode
Check browser console and server logs for detailed error messages.

## Production Deployment

1. Set up production MongoDB database
2. Configure production Whop API credentials
3. Deploy to Vercel, Netlify, or your preferred platform
4. Update NEXT_PUBLIC_APP_URL to production URL
5. Test all functionality in production environment

## Security Notes

- Admin setup key should be changed in production
- Use environment variables for all sensitive data
- Implement proper error handling for production
- Consider rate limiting for API endpoints

The system is now ready for testing and can be integrated into your Whop community for role-based notifications!
