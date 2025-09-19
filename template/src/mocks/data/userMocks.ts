import { faker } from '@faker-js/faker';
import type { User, UserProfile } from '../../core/types';

export interface MockUser extends User {
  // Legacy fields for backward compatibility
  name?: string;
  role?: 'admin' | 'user' | 'moderator';
  isActive?: boolean;
}

// Generate a single mock user
export const generateMockUser = (overrides: Partial<MockUser> = {}): MockUser => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email({ firstName, lastName }).toLowerCase();
  const displayName = `${firstName} ${lastName}`;

  return {
    id: faker.string.uuid(),
    email,
    emailVerified: faker.datatype.boolean({ probability: 0.8 }),
    status: ['active', 'inactive', 'suspended'][Math.floor(Math.random() * 3)] as 'active' | 'inactive' | 'suspended',
    profile: {
      firstName,
      lastName,
      displayName,
      avatar: faker.image.avatar(),
      timezone: faker.location.timeZone(),
      locale: 'en-US'
    },
    createdAt: faker.date.past({ years: 2 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),

    // Legacy fields for backward compatibility
    name: displayName,
    role: 'user',
    isActive: faker.datatype.boolean(),

    ...overrides,
  };
};

// Generate multiple users
export const generateMockUsers = (count: number = 10): MockUser[] => {
  return Array.from({ length: count }, () => generateMockUser());
};

// Predefined mock users for consistent testing
export const userMocks = {
  // Admin user for testing admin features
  admin: generateMockUser({
    id: 'admin-user-1',
    email: 'admin@example.com',
    emailVerified: true,
    status: 'active',
    profile: {
      firstName: 'Admin',
      lastName: 'User',
      displayName: 'Admin User',
      timezone: 'UTC',
      locale: 'en-US'
    },
    name: 'Admin User',
    role: 'admin',
    isActive: true,
  }),

  // Regular user for testing standard features
  user: generateMockUser({
    id: 'regular-user-1',
    email: 'john.doe@example.com',
    emailVerified: true,
    status: 'active',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      displayName: 'John Doe',
      timezone: 'UTC',
      locale: 'en-US'
    },
    name: 'John Doe',
    role: 'user',
    isActive: true,
  }),

  // Inactive user for testing status scenarios
  inactiveUser: generateMockUser({
    id: 'inactive-user-1',
    email: 'inactive@example.com',
    emailVerified: false,
    status: 'inactive',
    profile: {
      firstName: 'Inactive',
      lastName: 'User',
      displayName: 'Inactive User',
      timezone: 'UTC',
      locale: 'en-US'
    },
    name: 'Inactive User',
    role: 'user',
    isActive: false,
  }),

  // Generate a list of users for pagination/listing
  list: generateMockUsers(25),
};

// Helper to find user by ID
export const findUserById = (id: string): MockUser | undefined => {
  // Check predefined users first
  const predefinedUser = Object.values(userMocks).find(user => 
    typeof user === 'object' && 'id' in user && user.id === id
  ) as MockUser | undefined;
  
  if (predefinedUser) return predefinedUser;
  
  // Check in the list
  return userMocks.list.find(user => user.id === id);
};

// Helper to update user
export const updateUserInMocks = (id: string, updates: Partial<MockUser>): MockUser | null => {
  const user = findUserById(id);
  if (!user) return null;
  
  Object.assign(user, updates, { updatedAt: new Date().toISOString() });
  return user;
};

// Helper to delete user from list
export const deleteUserFromMocks = (id: string): boolean => {
  const index = userMocks.list.findIndex(user => user.id === id);
  if (index > -1) {
    userMocks.list.splice(index, 1);
    return true;
  }
  return false;
};

// Helper to add user to list
export const addUserToMocks = (user: Omit<MockUser, 'id' | 'createdAt' | 'updatedAt'>): MockUser => {
  const newUser = generateMockUser(user);
  userMocks.list.unshift(newUser);
  return newUser;
};