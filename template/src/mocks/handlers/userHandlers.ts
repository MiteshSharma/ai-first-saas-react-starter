import MockAdapter from 'axios-mock-adapter';
import { 
  userMocks, 
  findUserById, 
  updateUserInMocks, 
  deleteUserFromMocks, 
  addUserToMocks,
  generateMockUser,
  type MockUser 
} from '../data/userMocks';

// Helper to simulate realistic response delays
const getRandomDelay = () => Math.floor(Math.random() * 800) + 200; // 200-1000ms

export const setupUserMocks = (mock: MockAdapter) => {
  // GET /users - List users with pagination and filtering
  mock.onGet(/\/users(\?.*)?/).reply((config) => {
    const url = new URL('http://localhost' + config.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || 'all';
    const role = url.searchParams.get('role') || '';

    let filteredUsers = [...userMocks.list];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.profile?.displayName?.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (status !== 'all') {
      const isActive = status === 'active';
      filteredUsers = filteredUsers.filter(user => user.isActive === isActive);
    }

    // Apply role filter
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    // Calculate pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Response format matching typical pagination APIs
    const response = {
      data: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit),
        hasNext: endIndex < filteredUsers.length,
        hasPrev: page > 1,
      },
      meta: {
        filters: { search, status, role },
        timestamp: new Date().toISOString(),
      },
    };

    return [200, response];
  });

  // GET /users/:id - Get single user
  mock.onGet(/\/users\/(.+)/).reply((config) => {
    const userId = config.url?.split('/').pop();
    if (!userId) {
      return [400, { message: 'User ID is required' }];
    }

    const user = findUserById(userId);
    if (!user) {
      return [404, { 
        message: 'User not found',
        code: 'USER_NOT_FOUND',
        userId 
      }];
    }

    return [200, { data: user }];
  });

  // POST /users - Create new user
  mock.onPost('/users').reply((config) => {
    try {
      const userData = JSON.parse(config.data);
      
      // Validate required fields
      if (!userData.email) {
        return [400, {
          message: 'Email is required',
          code: 'VALIDATION_ERROR',
          errors: {
            email: !userData.email ? 'Email is required' : null,
          }
        }];
      }

      // Check for duplicate email
      const existingUser = userMocks.list.find(user => 
        user.email.toLowerCase() === userData.email.toLowerCase()
      );
      
      if (existingUser) {
        return [409, { 
          message: 'Email already exists',
          code: 'EMAIL_CONFLICT',
          email: userData.email 
        }];
      }

      // Create new user
      const newUser = addUserToMocks({
        email: userData.email,
        emailVerified: userData.emailVerified || false,
        status: userData.status || 'active',
        profile: userData.profile || {
          firstName: userData.firstName || 'Unknown',
          lastName: userData.lastName || 'User',
          displayName: userData.displayName || `${userData.firstName || 'Unknown'} ${userData.lastName || 'User'}`,
          timezone: 'UTC',
          locale: 'en-US'
        },
        // Legacy fields for backward compatibility
        name: userData.name || userData.displayName || `${userData.firstName || 'Unknown'} ${userData.lastName || 'User'}`,
        role: userData.role || 'user',
        isActive: userData.isActive !== undefined ? userData.isActive : true,
      });

      return [201, { 
        data: newUser,
        message: 'User created successfully' 
      }];
    } catch (error) {
      return [400, { 
        message: 'Invalid JSON data',
        code: 'INVALID_JSON' 
      }];
    }
  });

  // PUT /users/:id - Update user
  mock.onPut(/\/users\/(.+)/).reply((config) => {
    const userId = config.url?.split('/').pop();
    if (!userId) {
      return [400, { message: 'User ID is required' }];
    }

    try {
      const updates = JSON.parse(config.data);
      
      // Check if user exists
      const existingUser = findUserById(userId);
      if (!existingUser) {
        return [404, { 
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          userId 
        }];
      }

      // Check for email conflicts (if email is being updated)
      if (updates.email && updates.email !== existingUser.email) {
        const emailConflict = userMocks.list.find(user => 
          user.id !== userId && 
          user.email.toLowerCase() === updates.email.toLowerCase()
        );
        
        if (emailConflict) {
          return [409, { 
            message: 'Email already exists',
            code: 'EMAIL_CONFLICT',
            email: updates.email 
          }];
        }
      }

      // Update user
      const updatedUser = updateUserInMocks(userId, updates);
      
      return [200, { 
        data: updatedUser,
        message: 'User updated successfully' 
      }];
    } catch (error) {
      return [400, { 
        message: 'Invalid JSON data',
        code: 'INVALID_JSON' 
      }];
    }
  });

  // DELETE /users/:id - Delete user
  mock.onDelete(/\/users\/(.+)/).reply((config) => {
    const userId = config.url?.split('/').pop();
    if (!userId) {
      return [400, { message: 'User ID is required' }];
    }

    // Check if user exists
    const user = findUserById(userId);
    if (!user) {
      return [404, { 
        message: 'User not found',
        code: 'USER_NOT_FOUND',
        userId 
      }];
    }

    // Prevent deletion of admin users (business rule example)
    if (user.role === 'admin') {
      return [403, { 
        message: 'Cannot delete admin users',
        code: 'ADMIN_DELETE_FORBIDDEN',
        userId 
      }];
    }

    // Delete user
    const deleted = deleteUserFromMocks(userId);
    
    if (deleted) {
      return [200, { 
        message: 'User deleted successfully',
        deletedUserId: userId 
      }];
    } else {
      return [500, { 
        message: 'Failed to delete user',
        code: 'DELETE_FAILED' 
      }];
    }
  });

  // PATCH /users/:id/status - Toggle user status
  mock.onPatch(/\/users\/(.+)\/status/).reply((config) => {
    const userId = config.url?.split('/')[3]; // Extract ID from path
    if (!userId) {
      return [400, { message: 'User ID is required' }];
    }

    try {
      const { isActive } = JSON.parse(config.data);
      
      const updatedUser = updateUserInMocks(userId, { isActive });
      
      if (!updatedUser) {
        return [404, { 
          message: 'User not found',
          code: 'USER_NOT_FOUND',
          userId 
        }];
      }

      return [200, { 
        data: updatedUser,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully` 
      }];
    } catch (error) {
      return [400, { 
        message: 'Invalid request data',
        code: 'INVALID_DATA' 
      }];
    }
  });

  // GET /users/stats - Get user statistics
  mock.onGet('/users/stats').reply(() => {
    const totalUsers = userMocks.list.length;
    const activeUsers = userMocks.list.filter(user => user.isActive).length;
    const usersByRole = userMocks.list.reduce((acc, user) => {
      acc[user.role || 'user'] = (acc[user.role || 'user'] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      total: totalUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      byRole: usersByRole,
      recentlyCreated: userMocks.list.filter(user => {
        const createdDate = new Date(user.createdAt);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return createdDate > weekAgo;
      }).length,
    };

    return [200, { data: stats }];
  });

  console.log('👥 User API mocks registered');
};