import { NextRequest, NextResponse } from 'next/server';
import { getWhopSdk } from '@/lib/whop';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get user and their assigned roles
    const user = await User.findOne({ 
      userId: verification.userId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID 
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get notifications where this user was mentioned (sentTo includes their userId)
    const notifications = await Notification.find({ 
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      sentTo: verification.userId
    }).sort({ createdAt: -1 }).limit(50);

    return NextResponse.json({ 
      notifications: notifications.map(notif => ({
        id: notif._id,
        roleName: notif.roleName,
        message: notif.message,
        sentBy: notif.sentBy,
        createdAt: notif.createdAt,
        isRead: notif.readBy.includes(verification.userId)
      }))
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    // Find the notification and check if user was mentioned in it
    const notification = await Notification.findOne({ 
      _id: notificationId,
      companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
      sentTo: verification.userId
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
    }

    // Remove user from sentTo array (soft delete for this user)
    notification.sentTo = notification.sentTo.filter((userId: string) => userId !== verification.userId);
    
    if (notification.sentTo.length === 0) {
      // If no users left, delete the notification entirely
      await Notification.deleteOne({ _id: notificationId });
    } else {
      // Otherwise, just update the sentTo array
      await notification.save();
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const sdk = getWhopSdk();
    const verification = await sdk.verifyUserToken(request.headers);
    
    if (!verification.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const { notificationId, action } = await request.json();

    if (!notificationId) {
      return NextResponse.json({ error: 'Notification ID is required' }, { status: 400 });
    }

    if (action === 'mark-read') {
      // Mark notification as read for this user
      const notification = await Notification.findOne({ 
        _id: notificationId,
        companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
        sentTo: verification.userId
      });

      if (!notification) {
        return NextResponse.json({ error: 'Notification not found or access denied' }, { status: 404 });
      }

      // Add user to readBy array if not already there
      if (!notification.readBy.includes(verification.userId)) {
        notification.readBy.push(verification.userId);
        await notification.save();
      }

      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    } else if (action === 'mark-all-read') {
      // Mark all notifications as read for this user
      await Notification.updateMany(
        { 
          companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID,
          sentTo: verification.userId,
          readBy: { $ne: verification.userId }
        },
        { $push: { readBy: verification.userId } }
      );

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "mark-read" or "mark-all-read"' }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
