import type { User } from '../types/user';

export const USERS = {
  viewer: {
    username: 'viewer',
    email: 'viewer@solarmonitor.io',
    password: 'Viewer@123',
    badge: 'Viewer',
  },
  actionTaker: {
    username: 'actiontaker',
    email: 'actiontaker@solarmonitor.io',
    password: 'Action@123',
    badge: 'Action Taker',
  },
};

export function getUser(role: string): User {
  const user = Object.values(USERS).find((u) => u.badge === role);
  if (!user) throw new Error(`Unknown role: ${role}`);
  return user;
}
