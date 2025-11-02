import { connectDB } from '@/lib/mongodb';
import { User } from '@/models/User';
import Role from '@/models/Role';

/**
 * Ensures the "@all" role exists and assigns it to the user if they don't have it
 * This should be called whenever a user visits or is invited
 */
export async function ensureAndAssignAllRole(userId: string, companyId: string): Promise<void> {
  await connectDB();

  // 1. Ensure "@all" role exists
  let allRole = await Role.findOne({
    companyId,
    name: 'all'
  });

  if (!allRole) {
    // Create the "@all" role if it doesn't exist
    allRole = new Role({
      companyId,
      name: 'all',
      description: 'Automatic role for all users',
      color: '#6366f1' // Default indigo color
    });
    await allRole.save();
  }

  // 2. Get the user
  const user = await User.findOne({
    userId,
    companyId
  });

  if (!user) {
    return; // User doesn't exist yet, will be handled by the caller
  }

  // 3. Assign "@all" role if user doesn't have it
  const roleNameLower = 'all';
  if (!user.roles.includes(roleNameLower)) {
    user.roles.push(roleNameLower);
    await user.save();
  }
}
