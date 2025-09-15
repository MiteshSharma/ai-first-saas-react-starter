# API Mocking Documentation

This guide covers the comprehensive API mocking system in the AI-First SaaS React Starter, allowing you to develop and test your application without requiring a live backend server.

## 🎯 Overview

The API mocking system provides a **complete development environment** with realistic data, proper response timing, error simulation, and state persistence. This enables rapid development and testing of frontend features without backend dependencies.

### Key Features

- **Realistic Mock Data** - Pre-generated realistic datasets
- **RESTful API Simulation** - Complete CRUD operations
- **Authentication Mocking** - JWT token simulation
- **Error Simulation** - Test error handling scenarios
- **Network Delay Simulation** - Realistic response times
- **State Persistence** - Mock data persists across page reloads
- **Dynamic Data Generation** - Auto-generate data on demand
- **Plugin-Specific Mocks** - Mock endpoints for each plugin

### Architecture

```
API Mocking System
├── 🎭 Mock Server                  # Main mock server implementation
├── 📊 Mock Data                    # Pre-generated datasets
│   ├── Users & Authentication      # User accounts and auth data
│   ├── Projects & Tasks            # Project management data
│   ├── Files & Documents           # File system simulation
│   └── Analytics & Reports         # Dashboard and metrics data
├── 🔧 Mock Generators              # Dynamic data generation
├── 🌐 API Endpoints                # RESTful endpoint simulation
├── 🔒 Auth Simulation              # JWT and session handling
├── ⚠️ Error Simulation             # Error scenario testing
└── 🧪 Testing Integration          # Test environment setup
```

## 🚀 Getting Started

### Enable Mock API

The mock API can be enabled via environment variables:

```bash
# .env.development
REACT_APP_USE_MOCK_API=true
REACT_APP_MOCK_API_DELAY=500  # Average response delay in ms
REACT_APP_MOCK_ENABLE_ERRORS=true  # Enable error simulation
REACT_APP_MOCK_PERSISTENCE=true  # Persist state across reloads
```

### Start Development with Mocks

```bash
# Start with mock API enabled
REACT_APP_USE_MOCK_API=true npm start

# Or use the pre-configured script
npm run start:mock
```

## 🎭 Mock Server Implementation

### Core Mock Server

```typescript
// src/mocks/MockServer.ts
export class MockServer {
  private data: MockDatabase;
  private config: MockConfig;
  private middleware: MockMiddleware[] = [];

  constructor(config: MockConfig = {}) {
    this.config = {
      delay: { min: 200, max: 800 },
      errorRate: 0.05,
      enablePersistence: true,
      enableLogging: true,
      ...config
    };

    this.data = new MockDatabase(this.config);
    this.setupDefaultMiddleware();
    this.loadInitialData();
  }

  /**
   * Setup and start the mock server
   */
  async start(): Promise<void> {
    // Initialize database
    await this.data.initialize();

    // Setup API interceptors
    this.setupApiInterceptors();

    // Setup WebSocket simulation
    this.setupWebSocketMocks();

    console.log('🎭 Mock API Server started');
    console.log('📊 Mock data loaded:', this.data.getStats());
  }

  /**
   * Setup API request interceptors
   */
  private setupApiInterceptors(): void {
    // Mock authentication endpoints
    this.mockEndpoint('POST', '/auth/login', this.handleLogin.bind(this));
    this.mockEndpoint('POST', '/auth/logout', this.handleLogout.bind(this));
    this.mockEndpoint('POST', '/auth/refresh', this.handleRefreshToken.bind(this));
    this.mockEndpoint('GET', '/auth/me', this.handleGetCurrentUser.bind(this));

    // Mock user endpoints
    this.mockEndpoint('GET', '/users', this.handleGetUsers.bind(this));
    this.mockEndpoint('GET', '/users/:id', this.handleGetUser.bind(this));
    this.mockEndpoint('POST', '/users', this.handleCreateUser.bind(this));
    this.mockEndpoint('PUT', '/users/:id', this.handleUpdateUser.bind(this));
    this.mockEndpoint('DELETE', '/users/:id', this.handleDeleteUser.bind(this));

    // Mock project endpoints
    this.mockEndpoint('GET', '/projects', this.handleGetProjects.bind(this));
    this.mockEndpoint('POST', '/projects', this.handleCreateProject.bind(this));
    this.mockEndpoint('GET', '/projects/:id', this.handleGetProject.bind(this));
    this.mockEndpoint('PUT', '/projects/:id', this.handleUpdateProject.bind(this));

    // Mock task endpoints
    this.mockEndpoint('GET', '/tasks', this.handleGetTasks.bind(this));
    this.mockEndpoint('POST', '/tasks', this.handleCreateTask.bind(this));
    this.mockEndpoint('PUT', '/tasks/:id', this.handleUpdateTask.bind(this));
    this.mockEndpoint('DELETE', '/tasks/:id', this.handleDeleteTask.bind(this));

    // Mock file endpoints
    this.mockEndpoint('GET', '/files', this.handleGetFiles.bind(this));
    this.mockEndpoint('POST', '/files/upload', this.handleFileUpload.bind(this));
    this.mockEndpoint('DELETE', '/files/:id', this.handleDeleteFile.bind(this));

    // Mock analytics endpoints
    this.mockEndpoint('GET', '/analytics/dashboard', this.handleGetDashboardData.bind(this));
    this.mockEndpoint('GET', '/analytics/reports', this.handleGetReports.bind(this));
  }

  /**
   * Create a mock endpoint
   */
  private mockEndpoint(
    method: string,
    path: string,
    handler: MockEndpointHandler
  ): void {
    const pattern = this.pathToRegex(path);

    // Intercept axios requests
    if (window.mockAxios) {
      window.mockAxios.onAny(pattern).reply(async (config) => {
        return this.processRequest(method, path, config, handler);
      });
    }

    // Intercept fetch requests
    this.interceptFetch(method, pattern, handler);
  }

  /**
   * Process mock request
   */
  private async processRequest(
    method: string,
    path: string,
    config: any,
    handler: MockEndpointHandler
  ): Promise<[number, any, any]> {
    try {
      // Apply middleware
      const processedConfig = await this.applyMiddleware(config);
      if (!processedConfig) {
        return [404, { error: 'Request filtered by middleware' }, {}];
      }

      // Simulate network delay
      await this.simulateDelay();

      // Check for error simulation
      if (this.shouldSimulateError()) {
        return this.generateErrorResponse();
      }

      // Extract parameters
      const params = this.extractParams(path, processedConfig.url);
      const body = processedConfig.data ? JSON.parse(processedConfig.data) : {};
      const query = this.parseQueryString(processedConfig.url);

      // Call handler
      const response = await handler({
        method,
        params,
        query,
        body,
        headers: processedConfig.headers || {},
        user: this.getCurrentUser(processedConfig.headers)
      });

      // Log request
      if (this.config.enableLogging) {
        console.log(`🎭 Mock ${method} ${path}`, {
          params,
          query,
          body,
          response: response.data
        });
      }

      return [response.status, response.data, response.headers || {}];
    } catch (error) {
      console.error('Mock endpoint error:', error);
      return [500, { error: 'Internal server error' }, {}];
    }
  }

  /**
   * Authentication handlers
   */
  private async handleLogin(request: MockRequest): Promise<MockResponse> {
    const { email, password } = request.body;

    // Find user
    const user = await this.data.findUser({ email });
    if (!user || !this.verifyPassword(password, user.password)) {
      return {
        status: 401,
        data: { error: 'Invalid credentials' }
      };
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Update user last login
    await this.data.updateUser(user.id, { lastLoginAt: new Date() });

    return {
      status: 200,
      data: {
        user: this.sanitizeUser(user),
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      }
    };
  }

  private async handleRefreshToken(request: MockRequest): Promise<MockResponse> {
    const { refreshToken } = request.body;

    if (!this.verifyRefreshToken(refreshToken)) {
      return {
        status: 401,
        data: { error: 'Invalid refresh token' }
      };
    }

    const userId = this.extractUserIdFromToken(refreshToken);
    const user = await this.data.getUser(userId);

    if (!user) {
      return {
        status: 401,
        data: { error: 'User not found' }
      };
    }

    const tokens = this.generateTokens(user);

    return {
      status: 200,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      }
    };
  }

  /**
   * User management handlers
   */
  private async handleGetUsers(request: MockRequest): Promise<MockResponse> {
    const { page = 1, pageSize = 20, search, role, status } = request.query;

    const filters: any = {};
    if (search) filters.search = search;
    if (role) filters.role = role;
    if (status) filters.status = status;

    const result = await this.data.getUsers({
      ...filters,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    return {
      status: 200,
      data: {
        users: result.users.map(user => this.sanitizeUser(user)),
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  }

  private async handleCreateUser(request: MockRequest): Promise<MockResponse> {
    const userData = request.body;

    // Validate required fields
    if (!userData.email || !userData.name) {
      return {
        status: 400,
        data: { error: 'Email and name are required' }
      };
    }

    // Check if user already exists
    const existingUser = await this.data.findUser({ email: userData.email });
    if (existingUser) {
      return {
        status: 409,
        data: { error: 'User with this email already exists' }
      };
    }

    // Create user
    const newUser = await this.data.createUser({
      ...userData,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      status: 201,
      data: { user: this.sanitizeUser(newUser) }
    };
  }

  /**
   * Task management handlers
   */
  private async handleGetTasks(request: MockRequest): Promise<MockResponse> {
    const {
      page = 1,
      pageSize = 20,
      status,
      priority,
      assignee,
      project,
      search
    } = request.query;

    const filters: any = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;
    if (assignee) filters.assigneeId = assignee;
    if (project) filters.projectId = project;
    if (search) filters.search = search;

    const result = await this.data.getTasks({
      ...filters,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    return {
      status: 200,
      data: {
        tasks: result.tasks,
        total: result.total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    };
  }

  private async handleCreateTask(request: MockRequest): Promise<MockResponse> {
    const taskData = request.body;
    const user = request.user;

    const newTask = await this.data.createTask({
      ...taskData,
      id: this.generateId(),
      createdBy: user?.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      status: 201,
      data: { task: newTask }
    };
  }

  /**
   * File management handlers
   */
  private async handleFileUpload(request: MockRequest): Promise<MockResponse> {
    const { fileName, fileSize, fileType } = request.body;

    // Simulate file upload
    await this.simulateUpload(fileSize);

    const file = await this.data.createFile({
      id: this.generateId(),
      name: fileName,
      size: fileSize,
      type: fileType,
      url: `/mock-files/${this.generateId()}.${this.getFileExtension(fileName)}`,
      uploadedBy: request.user?.id,
      createdAt: new Date()
    });

    return {
      status: 200,
      data: { file }
    };
  }

  /**
   * Utility methods
   */
  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * (this.config.delay.max - this.config.delay.min) + this.config.delay.min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private shouldSimulateError(): boolean {
    return Math.random() < this.config.errorRate;
  }

  private generateErrorResponse(): [number, any, any] {
    const errors = [
      [400, { error: 'Bad Request' }],
      [401, { error: 'Unauthorized' }],
      [403, { error: 'Forbidden' }],
      [404, { error: 'Not Found' }],
      [500, { error: 'Internal Server Error' }]
    ];

    const [status, data] = errors[Math.floor(Math.random() * errors.length)];
    return [status, data, {}];
  }

  private generateTokens(user: any) {
    const now = Date.now();
    const expiresAt = now + (24 * 60 * 60 * 1000); // 24 hours

    return {
      accessToken: `mock_access_token_${user.id}_${now}`,
      refreshToken: `mock_refresh_token_${user.id}_${now}`,
      expiresAt
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global mock server instance
export const mockServer = new MockServer();
```

## 📊 Mock Data Generation

### Data Generators

```typescript
// src/mocks/generators/DataGenerator.ts
export class DataGenerator {
  private faker: any;

  constructor() {
    // Use faker.js for realistic data generation
    this.faker = require('faker');
    this.faker.seed(12345); // Consistent seed for reproducible data
  }

  /**
   * Generate realistic user data
   */
  generateUsers(count: number): User[] {
    const users: User[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = this.faker.name.firstName();
      const lastName = this.faker.name.lastName();

      users.push({
        id: this.faker.datatype.uuid(),
        email: this.faker.internet.email(firstName, lastName).toLowerCase(),
        name: `${firstName} ${lastName}`,
        avatar: this.faker.internet.avatar(),
        role: this.faker.random.arrayElement(['admin', 'user', 'manager', 'viewer']),
        status: this.faker.random.arrayElement(['active', 'inactive', 'pending']),
        department: this.faker.random.arrayElement([
          'Engineering', 'Sales', 'Marketing', 'HR', 'Finance'
        ]),
        phone: this.faker.phone.phoneNumber(),
        jobTitle: this.faker.name.jobTitle(),
        bio: this.faker.lorem.paragraph(),
        location: `${this.faker.address.city()}, ${this.faker.address.country()}`,
        timezone: this.faker.date.timezone(),
        language: this.faker.random.arrayElement(['en', 'es', 'fr', 'de']),
        preferences: {
          theme: this.faker.random.arrayElement(['light', 'dark', 'auto']),
          notifications: {
            email: this.faker.datatype.boolean(),
            push: this.faker.datatype.boolean(),
            sms: this.faker.datatype.boolean()
          }
        },
        createdAt: this.faker.date.past(),
        updatedAt: this.faker.date.recent(),
        lastLoginAt: this.faker.date.recent()
      });
    }

    return users;
  }

  /**
   * Generate project data
   */
  generateProjects(count: number, users: User[]): Project[] {
    const projects: Project[] = [];

    for (let i = 0; i < count; i++) {
      const owner = this.faker.random.arrayElement(users);
      const memberCount = this.faker.datatype.number({ min: 2, max: 8 });
      const members = this.faker.random.arrayElements(users, memberCount);

      projects.push({
        id: this.faker.datatype.uuid(),
        name: this.faker.company.catchPhrase(),
        description: this.faker.lorem.sentences(3),
        status: this.faker.random.arrayElement(['planning', 'active', 'on-hold', 'completed']),
        priority: this.faker.random.arrayElement(['low', 'medium', 'high', 'critical']),
        ownerId: owner.id,
        members: members.map(member => ({
          userId: member.id,
          role: this.faker.random.arrayElement(['owner', 'admin', 'member', 'viewer']),
          joinedAt: this.faker.date.past()
        })),
        budget: this.faker.datatype.number({ min: 10000, max: 500000 }),
        startDate: this.faker.date.past(),
        endDate: this.faker.date.future(),
        tags: this.faker.random.arrayElements([
          'web', 'mobile', 'api', 'frontend', 'backend', 'design', 'marketing'
        ], this.faker.datatype.number({ min: 1, max: 4 })),
        createdAt: this.faker.date.past(),
        updatedAt: this.faker.date.recent()
      });
    }

    return projects;
  }

  /**
   * Generate task data
   */
  generateTasks(count: number, projects: Project[], users: User[]): Task[] {
    const tasks: Task[] = [];

    for (let i = 0; i < count; i++) {
      const project = this.faker.random.arrayElement(projects);
      const assignee = this.faker.random.arrayElement(
        project.members.map(m => users.find(u => u.id === m.userId)!)
      );

      tasks.push({
        id: this.faker.datatype.uuid(),
        title: this.faker.lorem.sentence(),
        description: this.faker.lorem.paragraph(),
        status: this.faker.random.arrayElement(['todo', 'in_progress', 'review', 'done']),
        priority: this.faker.random.arrayElement(['low', 'medium', 'high', 'critical']),
        projectId: project.id,
        assigneeId: assignee?.id,
        createdBy: project.ownerId,
        estimatedHours: this.faker.datatype.number({ min: 1, max: 40 }),
        actualHours: this.faker.datatype.number({ min: 0, max: 50 }),
        dueDate: this.faker.date.future(),
        tags: this.faker.random.arrayElements([
          'bug', 'feature', 'improvement', 'documentation', 'test'
        ], this.faker.datatype.number({ min: 0, max: 3 })),
        attachments: this.generateTaskAttachments(),
        comments: this.generateTaskComments(users),
        createdAt: this.faker.date.past(),
        updatedAt: this.faker.date.recent()
      });
    }

    return tasks;
  }

  /**
   * Generate file data
   */
  generateFiles(count: number, users: User[]): FileItem[] {
    const files: FileItem[] = [];

    for (let i = 0; i < count; i++) {
      const owner = this.faker.random.arrayElement(users);
      const fileType = this.faker.random.arrayElement([
        'image/jpeg', 'image/png', 'application/pdf', 'text/plain',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]);

      files.push({
        id: this.faker.datatype.uuid(),
        name: this.generateFileName(fileType),
        type: fileType,
        size: this.faker.datatype.number({ min: 1024, max: 10485760 }), // 1KB to 10MB
        url: this.generateFileUrl(),
        thumbnailUrl: fileType.startsWith('image/') ? this.generateThumbnailUrl() : undefined,
        parentId: null, // Root folder
        ownerId: owner.id,
        permissions: {
          read: [owner.id],
          write: [owner.id],
          admin: [owner.id]
        },
        metadata: this.generateFileMetadata(fileType),
        isFolder: false,
        isShared: this.faker.datatype.boolean(),
        isTrashed: false,
        createdAt: this.faker.date.past(),
        updatedAt: this.faker.date.recent()
      });
    }

    return files;
  }

  /**
   * Generate analytics data
   */
  generateAnalyticsData(): AnalyticsData {
    return {
      dashboard: {
        totalUsers: this.faker.datatype.number({ min: 100, max: 10000 }),
        activeUsers: this.faker.datatype.number({ min: 50, max: 5000 }),
        totalProjects: this.faker.datatype.number({ min: 10, max: 500 }),
        completedTasks: this.faker.datatype.number({ min: 500, max: 50000 }),
        revenue: this.faker.datatype.number({ min: 10000, max: 1000000 }),
        growth: this.faker.datatype.float({ min: -10, max: 25, precision: 0.1 })
      },
      charts: {
        userGrowth: this.generateTimeSeriesData(12),
        taskCompletion: this.generateTimeSeriesData(30),
        revenue: this.generateTimeSeriesData(12),
        projectStatus: this.generatePieChartData(['active', 'completed', 'on-hold', 'cancelled'])
      }
    };
  }

  /**
   * Generate time series data for charts
   */
  private generateTimeSeriesData(points: number): { date: string; value: number }[] {
    const data = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - points);

    for (let i = 0; i < points; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);

      data.push({
        date: date.toISOString().split('T')[0],
        value: this.faker.datatype.number({ min: 100, max: 1000 })
      });
    }

    return data;
  }

  /**
   * Generate pie chart data
   */
  private generatePieChartData(categories: string[]): { category: string; value: number }[] {
    return categories.map(category => ({
      category,
      value: this.faker.datatype.number({ min: 10, max: 100 })
    }));
  }

  private generateFileName(type: string): string {
    const extensions = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf',
      'text/plain': 'txt',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx'
    };

    const baseName = this.faker.system.fileName().split('.')[0];
    const extension = extensions[type] || 'bin';

    return `${baseName}.${extension}`;
  }

  private generateFileUrl(): string {
    return `https://mock-cdn.example.com/files/${this.faker.datatype.uuid()}`;
  }

  private generateThumbnailUrl(): string {
    return `https://mock-cdn.example.com/thumbnails/${this.faker.datatype.uuid()}_thumb.jpg`;
  }

  private generateFileMetadata(type: string): any {
    const metadata: any = {};

    if (type.startsWith('image/')) {
      metadata.dimensions = {
        width: this.faker.datatype.number({ min: 100, max: 4000 }),
        height: this.faker.datatype.number({ min: 100, max: 4000 })
      };
    }

    if (type.startsWith('video/')) {
      metadata.duration = this.faker.datatype.number({ min: 10, max: 3600 });
    }

    return metadata;
  }

  private generateTaskAttachments(): any[] {
    const count = this.faker.datatype.number({ min: 0, max: 3 });
    const attachments = [];

    for (let i = 0; i < count; i++) {
      attachments.push({
        id: this.faker.datatype.uuid(),
        name: this.faker.system.fileName(),
        url: this.generateFileUrl(),
        size: this.faker.datatype.number({ min: 1024, max: 1048576 }),
        uploadedAt: this.faker.date.recent()
      });
    }

    return attachments;
  }

  private generateTaskComments(users: User[]): any[] {
    const count = this.faker.datatype.number({ min: 0, max: 5 });
    const comments = [];

    for (let i = 0; i < count; i++) {
      const author = this.faker.random.arrayElement(users);
      comments.push({
        id: this.faker.datatype.uuid(),
        content: this.faker.lorem.sentences(2),
        authorId: author.id,
        authorName: author.name,
        createdAt: this.faker.date.recent()
      });
    }

    return comments;
  }
}
```

## 🔧 Mock Database

### In-Memory Database

```typescript
// src/mocks/database/MockDatabase.ts
export class MockDatabase {
  private users: User[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];
  private files: FileItem[] = [];
  private analytics: AnalyticsData | null = null;
  private generator: DataGenerator;

  constructor(private config: MockConfig) {
    this.generator = new DataGenerator();
  }

  /**
   * Initialize database with sample data
   */
  async initialize(): Promise<void> {
    // Load persisted data if available
    if (this.config.enablePersistence) {
      await this.loadPersistedData();
    }

    // Generate initial data if empty
    if (this.users.length === 0) {
      await this.generateInitialData();
    }

    // Save to persistence
    if (this.config.enablePersistence) {
      await this.saveData();
    }

    console.log('🗄️ Mock database initialized', this.getStats());
  }

  /**
   * Generate initial sample data
   */
  private async generateInitialData(): Promise<void> {
    console.log('📊 Generating initial mock data...');

    // Generate users
    this.users = this.generator.generateUsers(50);

    // Add admin user for testing
    this.users.unshift({
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'admin',
      status: 'active',
      department: 'Engineering',
      phone: '+1 (555) 123-4567',
      jobTitle: 'System Administrator',
      bio: 'System administrator with full access to all features.',
      location: 'San Francisco, CA',
      timezone: 'America/Los_Angeles',
      language: 'en',
      password: 'hashedpassword', // In real scenario, this would be hashed
      preferences: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date(),
      lastLoginAt: new Date()
    });

    // Generate projects
    this.projects = this.generator.generateProjects(20, this.users);

    // Generate tasks
    this.tasks = this.generator.generateTasks(200, this.projects, this.users);

    // Generate files
    this.files = this.generator.generateFiles(100, this.users);

    // Generate analytics data
    this.analytics = this.generator.generateAnalyticsData();
  }

  /**
   * User operations
   */
  async getUsers(filters: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: string;
    status?: string;
  } = {}): Promise<{ users: User[]; total: number }> {
    let filteredUsers = [...this.users];

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredUsers = filteredUsers.filter(user =>
        user.name.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    if (filters.role) {
      filteredUsers = filteredUsers.filter(user => user.role === filters.role);
    }

    if (filters.status) {
      filteredUsers = filteredUsers.filter(user => user.status === filters.status);
    }

    // Apply pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);

    return {
      users: paginatedUsers,
      total: filteredUsers.length
    };
  }

  async getUser(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async findUser(criteria: Partial<User>): Promise<User | null> {
    return this.users.find(user => {
      for (const [key, value] of Object.entries(criteria)) {
        if (user[key] !== value) return false;
      }
      return true;
    }) || null;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const newUser: User = {
      id: userData.id || this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...userData
    } as User;

    this.users.push(newUser);
    await this.saveData();

    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date()
    };

    await this.saveData();
    return this.users[userIndex];
  }

  async deleteUser(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    await this.saveData();

    return true;
  }

  /**
   * Task operations
   */
  async getTasks(filters: {
    page?: number;
    pageSize?: number;
    status?: string;
    priority?: string;
    assigneeId?: string;
    projectId?: string;
    search?: string;
  } = {}): Promise<{ tasks: Task[]; total: number }> {
    let filteredTasks = [...this.tasks];

    // Apply filters
    if (filters.status) {
      filteredTasks = filteredTasks.filter(task => task.status === filters.status);
    }

    if (filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === filters.priority);
    }

    if (filters.assigneeId) {
      filteredTasks = filteredTasks.filter(task => task.assigneeId === filters.assigneeId);
    }

    if (filters.projectId) {
      filteredTasks = filteredTasks.filter(task => task.projectId === filters.projectId);
    }

    if (filters.search) {
      const search = filters.search.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(search) ||
        (task.description && task.description.toLowerCase().includes(search))
      );
    }

    // Sort by creation date (newest first)
    filteredTasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply pagination
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;
    const startIndex = (page - 1) * pageSize;
    const paginatedTasks = filteredTasks.slice(startIndex, startIndex + pageSize);

    return {
      tasks: paginatedTasks,
      total: filteredTasks.length
    };
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const newTask: Task = {
      id: taskData.id || this.generateId(),
      status: 'todo',
      priority: 'medium',
      tags: [],
      attachments: [],
      comments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...taskData
    } as Task;

    this.tasks.push(newTask);
    await this.saveData();

    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const taskIndex = this.tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) return null;

    this.tasks[taskIndex] = {
      ...this.tasks[taskIndex],
      ...updates,
      updatedAt: new Date()
    };

    await this.saveData();
    return this.tasks[taskIndex];
  }

  /**
   * File operations
   */
  async createFile(fileData: Partial<FileItem>): Promise<FileItem> {
    const newFile: FileItem = {
      id: fileData.id || this.generateId(),
      permissions: { read: [], write: [], admin: [] },
      metadata: {},
      isFolder: false,
      isShared: false,
      isTrashed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...fileData
    } as FileItem;

    this.files.push(newFile);
    await this.saveData();

    return newFile;
  }

  /**
   * Persistence methods
   */
  private async saveData(): Promise<void> {
    if (!this.config.enablePersistence) return;

    try {
      const data = {
        users: this.users,
        projects: this.projects,
        tasks: this.tasks,
        files: this.files,
        analytics: this.analytics,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('mockDatabase', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save mock data to localStorage:', error);
    }
  }

  private async loadPersistedData(): Promise<void> {
    try {
      const savedData = localStorage.getItem('mockDatabase');
      if (savedData) {
        const data = JSON.parse(savedData);

        // Convert date strings back to Date objects
        this.users = this.deserializeDates(data.users, ['createdAt', 'updatedAt', 'lastLoginAt']);
        this.projects = this.deserializeDates(data.projects, ['createdAt', 'updatedAt', 'startDate', 'endDate']);
        this.tasks = this.deserializeDates(data.tasks, ['createdAt', 'updatedAt', 'dueDate']);
        this.files = this.deserializeDates(data.files, ['createdAt', 'updatedAt']);
        this.analytics = data.analytics;

        console.log('📥 Loaded persisted mock data');
      }
    } catch (error) {
      console.warn('Failed to load persisted mock data:', error);
    }
  }

  private deserializeDates(items: any[], dateFields: string[]): any[] {
    return items.map(item => {
      const deserialized = { ...item };
      for (const field of dateFields) {
        if (deserialized[field]) {
          deserialized[field] = new Date(deserialized[field]);
        }
      }
      return deserialized;
    });
  }

  /**
   * Get database statistics
   */
  getStats(): DatabaseStats {
    return {
      users: this.users.length,
      projects: this.projects.length,
      tasks: this.tasks.length,
      files: this.files.length
    };
  }

  private generateId(): string {
    return `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

interface DatabaseStats {
  users: number;
  projects: number;
  tasks: number;
  files: number;
}
```

## 🧪 Testing Integration

### Test Environment Setup

```typescript
// src/mocks/testing/testSetup.ts
export class MockTestEnvironment {
  private mockServer: MockServer;
  private originalFetch: typeof window.fetch;
  private cleanupFunctions: (() => void)[] = [];

  constructor(config: Partial<MockConfig> = {}) {
    this.mockServer = new MockServer({
      delay: { min: 0, max: 10 }, // Fast responses in tests
      errorRate: 0, // No random errors in tests
      enablePersistence: false, // No persistence in tests
      enableLogging: false, // No logging in tests
      ...config
    });
  }

  /**
   * Setup mock environment for tests
   */
  async setup(): Promise<void> {
    // Start mock server
    await this.mockServer.start();

    // Setup test data
    await this.setupTestData();

    console.log('🧪 Mock test environment ready');
  }

  /**
   * Cleanup mock environment
   */
  async cleanup(): Promise<void> {
    // Run all cleanup functions
    this.cleanupFunctions.forEach(cleanup => cleanup());
    this.cleanupFunctions = [];

    // Reset mock server
    this.mockServer.reset();

    console.log('🧹 Mock test environment cleaned up');
  }

  /**
   * Create test user and return auth tokens
   */
  async createTestUser(userData: Partial<User> = {}): Promise<{
    user: User;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const testUser = await this.mockServer.createUser({
      email: 'test@example.com',
      name: 'Test User',
      role: 'user',
      status: 'active',
      ...userData
    });

    const tokens = this.mockServer.generateTokens(testUser);

    return { user: testUser, tokens };
  }

  /**
   * Setup specific test scenarios
   */
  async setupTestScenario(scenario: string): Promise<void> {
    switch (scenario) {
      case 'empty-state':
        await this.setupEmptyState();
        break;
      case 'full-data':
        await this.setupFullDataSet();
        break;
      case 'error-prone':
        await this.setupErrorProneEnvironment();
        break;
      default:
        throw new Error(`Unknown test scenario: ${scenario}`);
    }
  }

  /**
   * Mock specific API responses
   */
  mockApiResponse(
    method: string,
    path: string,
    response: any,
    options: { delay?: number; status?: number } = {}
  ): () => void {
    const cleanup = this.mockServer.mockEndpoint(
      method,
      path,
      async () => ({
        status: options.status || 200,
        data: response
      })
    );

    this.cleanupFunctions.push(cleanup);
    return cleanup;
  }

  /**
   * Simulate network conditions
   */
  simulateNetworkConditions(condition: 'slow' | 'fast' | 'unreliable'): void {
    switch (condition) {
      case 'slow':
        this.mockServer.setConfig({ delay: { min: 2000, max: 5000 } });
        break;
      case 'fast':
        this.mockServer.setConfig({ delay: { min: 10, max: 50 } });
        break;
      case 'unreliable':
        this.mockServer.setConfig({ errorRate: 0.3 });
        break;
    }
  }

  private async setupTestData(): Promise<void> {
    // Create admin user for tests
    await this.createTestUser({
      id: 'test-admin',
      email: 'admin@test.com',
      name: 'Test Admin',
      role: 'admin'
    });

    // Create some basic test projects and tasks
    const testProject = await this.mockServer.createProject({
      id: 'test-project',
      name: 'Test Project',
      ownerId: 'test-admin'
    });

    await this.mockServer.createTask({
      id: 'test-task',
      title: 'Test Task',
      projectId: testProject.id,
      assigneeId: 'test-admin'
    });
  }

  private async setupEmptyState(): Promise<void> {
    // Clear all data
    this.mockServer.clearData();
  }

  private async setupFullDataSet(): Promise<void> {
    // Generate large dataset for performance testing
    const users = this.mockServer.generateUsers(100);
    const projects = this.mockServer.generateProjects(50, users);
    const tasks = this.mockServer.generateTasks(500, projects, users);

    await this.mockServer.loadData({ users, projects, tasks });
  }

  private async setupErrorProneEnvironment(): Promise<void> {
    this.mockServer.setConfig({
      errorRate: 0.2, // 20% error rate
      delay: { min: 100, max: 2000 } // Variable delays
    });
  }
}

// Jest setup helper
export const setupMockEnvironment = () => {
  const mockEnv = new MockTestEnvironment();

  beforeAll(async () => {
    await mockEnv.setup();
  });

  afterAll(async () => {
    await mockEnv.cleanup();
  });

  beforeEach(async () => {
    // Reset to clean state between tests
    await mockEnv.setupTestScenario('empty-state');
  });

  return mockEnv;
};
```

## 📋 Usage Examples

### Development Workflow

```typescript
// Example: Developing a new feature with mocks
const TaskManagementPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // This will hit the mock API when REACT_APP_USE_MOCK_API=true
      const response = await apiHelper.get<{ tasks: Task[]; total: number }>('/tasks');
      setTasks(response.tasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      // Mock API can simulate different error scenarios
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  if (loading) return <Spin size="large" />;

  return (
    <div>
      <h1>Tasks ({tasks.length})</h1>
      {/* Rest of component */}
    </div>
  );
};
```

### Testing with Mocks

```typescript
// Example: Testing component with mock data
describe('TaskList Component', () => {
  const mockEnv = setupMockEnvironment();

  it('should display tasks from API', async () => {
    // Setup test data
    const testTasks = [
      { id: '1', title: 'Test Task 1', status: 'todo' },
      { id: '2', title: 'Test Task 2', status: 'done' }
    ];

    mockEnv.mockApiResponse('GET', '/tasks', {
      tasks: testTasks,
      total: testTasks.length
    });

    // Render component
    render(<TaskList />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Task 1')).toBeInTheDocument();
      expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    });
  });

  it('should handle API errors gracefully', async () => {
    // Mock error response
    mockEnv.mockApiResponse('GET', '/tasks',
      { error: 'Internal Server Error' },
      { status: 500 }
    );

    render(<TaskList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

## 📋 Best Practices

### 1. Mock Data Quality
- **Realistic Data** - Use realistic names, dates, and relationships
- **Consistent IDs** - Use predictable ID patterns for testing
- **Edge Cases** - Include boundary conditions and edge cases
- **Relationships** - Maintain referential integrity between entities

### 2. Performance
- **Fast Responses** - Keep mock responses fast for development
- **Configurable Delays** - Allow delay simulation for testing
- **Memory Management** - Avoid memory leaks in long-running sessions
- **Efficient Filtering** - Optimize filtering and pagination

### 3. Testing
- **Isolated Tests** - Each test should have clean mock state
- **Predictable Data** - Use seeded random generation for consistency
- **Error Simulation** - Test various error scenarios
- **State Management** - Properly manage mock state between tests

### 4. Maintenance
- **Schema Synchronization** - Keep mock schemas in sync with real API
- **Documentation** - Document available mock endpoints
- **Version Control** - Version mock data with application code
- **Environment Separation** - Keep mock and real API configurations separate

---

The API mocking system provides a comprehensive development environment that enables rapid frontend development without backend dependencies. It supports realistic data generation, error simulation, and comprehensive testing scenarios.

## 📚 Next Steps

Continue exploring the framework:

1. **[Testing](./testing.md)** - Comprehensive testing strategies with mocks
2. **[CLI Reference](./cli-reference.md)** - Code generation and build tools
3. **[Deployment](./deployment.md)** - Production deployment strategies
4. **[Performance](./performance.md)** - Optimization techniques

**Build faster with comprehensive API mocking!** 🎭✨