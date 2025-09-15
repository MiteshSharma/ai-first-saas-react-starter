# Deployment Guide

This guide covers deploying the AI-First SaaS React Starter framework to production environments, including various hosting platforms, CI/CD pipelines, and best practices.

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Platforms](#deployment-platforms)
- [CI/CD Pipelines](#cicd-pipelines)
- [Environment Variables](#environment-variables)
- [Performance Optimization](#performance-optimization)
- [Security Considerations](#security-considerations)
- [Monitoring & Logging](#monitoring--logging)
- [Rollback Strategies](#rollback-strategies)
- [Multi-Environment Setup](#multi-environment-setup)
- [Plugin Deployment](#plugin-deployment)
- [Troubleshooting](#troubleshooting)

## Pre-Deployment Checklist

Before deploying to production, ensure the following:

### Code Quality
- [ ] All tests pass (`npm run test`)
- [ ] TypeScript compilation succeeds (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Code coverage meets requirements (80%+)
- [ ] Security audit passes (`npm audit`)

### Build Verification
- [ ] Production build succeeds (`npm run build`)
- [ ] Build artifacts are optimized and compressed
- [ ] Bundle size is within acceptable limits
- [ ] All plugins load correctly in production mode

### Configuration
- [ ] Environment variables are configured
- [ ] API endpoints are set to production
- [ ] Database connections are configured
- [ ] Third-party service credentials are set
- [ ] SSL certificates are configured

### Testing
- [ ] E2E tests pass in production-like environment
- [ ] Performance testing completed
- [ ] Security testing completed
- [ ] Cross-browser testing completed

## Environment Configuration

### Environment Files

Create environment-specific configuration files:

```bash
# Development
.env.development

# Staging
.env.staging

# Production
.env.production
```

### Sample Environment Configuration

```bash
# .env.production
NODE_ENV=production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_AUTH_DOMAIN=yourdomain.auth0.com
REACT_APP_AUTH_CLIENT_ID=your_auth_client_id
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_ANALYTICS_ID=your_analytics_id
REACT_APP_USE_MOCK_API=false

# Build configuration
GENERATE_SOURCEMAP=false
REACT_APP_VERSION=$npm_package_version
REACT_APP_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Feature flags
REACT_APP_ENABLE_PLUGIN_HOT_RELOAD=false
REACT_APP_ENABLE_DEVELOPER_TOOLS=false
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
```

### Configuration Management

```typescript
// src/config/environment.ts
interface Config {
  apiUrl: string;
  authDomain: string;
  authClientId: string;
  sentryDsn: string;
  analyticsId: string;
  useMockApi: boolean;
  enablePluginHotReload: boolean;
  enableDeveloperTools: boolean;
  enablePerformanceMonitoring: boolean;
  version: string;
  buildDate: string;
}

const config: Config = {
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:3001',
  authDomain: process.env.REACT_APP_AUTH_DOMAIN || '',
  authClientId: process.env.REACT_APP_AUTH_CLIENT_ID || '',
  sentryDsn: process.env.REACT_APP_SENTRY_DSN || '',
  analyticsId: process.env.REACT_APP_ANALYTICS_ID || '',
  useMockApi: process.env.REACT_APP_USE_MOCK_API === 'true',
  enablePluginHotReload: process.env.REACT_APP_ENABLE_PLUGIN_HOT_RELOAD === 'true',
  enableDeveloperTools: process.env.REACT_APP_ENABLE_DEVELOPER_TOOLS === 'true',
  enablePerformanceMonitoring: process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true',
  version: process.env.REACT_APP_VERSION || '1.0.0',
  buildDate: process.env.REACT_APP_BUILD_DATE || new Date().toISOString()
};

export default config;
```

## Build Process

### Production Build Script

```json
{
  "scripts": {
    "build": "react-scripts build",
    "build:analyze": "npm run build && npx bundle-analyzer build/static/js/*.js",
    "build:staging": "env-cmd -f .env.staging npm run build",
    "build:production": "env-cmd -f .env.production npm run build",
    "prebuild": "npm run test:ci && npm run typecheck && npm run lint"
  }
}
```

### Build Optimization

```javascript
// craco.config.js (if using CRACO)
const path = require('path');
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env }) => {
      if (env === 'production') {
        // Enable gzip compression
        webpackConfig.plugins.push(
          new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1
          })
        );

        // Code splitting optimization
        webpackConfig.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10
            },
            plugins: {
              test: /[\\/]src[\\/]plugins[\\/]/,
              name: 'plugins',
              chunks: 'all',
              priority: 5
            }
          }
        };
      }

      return webpackConfig;
    }
  }
};
```

### Build Artifacts

After a successful build, the following artifacts are generated:

```
build/
├── static/
│   ├── css/
│   │   └── main.[hash].css
│   ├── js/
│   │   ├── main.[hash].js
│   │   ├── vendors.[hash].js
│   │   └── plugins.[hash].js
│   └── media/
├── index.html
├── manifest.json
└── service-worker.js
```

## Deployment Platforms

### Vercel Deployment

#### Configuration

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "REACT_APP_API_URL": "@api_url",
    "REACT_APP_AUTH_DOMAIN": "@auth_domain"
  }
}
```

#### Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to staging
vercel --env .env.staging

# Deploy to production
vercel --prod --env .env.production
```

### Netlify Deployment

#### Configuration

```toml
# netlify.toml
[build]
  command = "npm run build:production"
  publish = "build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/static/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.js"
  [headers.values]
    Content-Type = "application/javascript"

[[headers]]
  for = "/*.css"
  [headers.values]
    Content-Type = "text/css"
```

#### Deployment Commands

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy to staging
netlify deploy --dir=build

# Deploy to production
netlify deploy --prod --dir=build
```

### AWS S3 + CloudFront

#### S3 Configuration

```bash
# Create S3 bucket
aws s3 mb s3://your-app-name-production

# Enable static website hosting
aws s3 website s3://your-app-name-production \
  --index-document index.html \
  --error-document index.html

# Upload build files
aws s3 sync build/ s3://your-app-name-production --delete
```

#### CloudFront Distribution

```json
{
  "Distribution": {
    "CallerReference": "your-app-name-production",
    "Comment": "AI-First SaaS React Starter",
    "DefaultRootObject": "index.html",
    "Origins": [
      {
        "Id": "S3-your-app-name-production",
        "DomainName": "your-app-name-production.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ],
    "DefaultCacheBehavior": {
      "TargetOriginId": "S3-your-app-name-production",
      "ViewerProtocolPolicy": "redirect-to-https",
      "Compress": true,
      "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
    },
    "CustomErrorResponses": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": 200
      }
    ]
  }
}
```

### Docker Deployment

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build:production

# Production stage
FROM nginx:alpine

# Copy build files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### Nginx Configuration

```nginx
# nginx.conf
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

#### Docker Commands

```bash
# Build image
docker build -t your-app-name:latest .

# Run container
docker run -p 80:80 your-app-name:latest

# Deploy to registry
docker tag your-app-name:latest your-registry.com/your-app-name:latest
docker push your-registry.com/your-app-name:latest
```

## CI/CD Pipelines

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:ci

      - name: Run type checking
        run: npm run typecheck

      - name: Run linting
        run: npm run lint

      - name: Security audit
        run: npm audit --audit-level=moderate

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:production
        env:
          REACT_APP_API_URL: ${{ secrets.PRODUCTION_API_URL }}
          REACT_APP_AUTH_DOMAIN: ${{ secrets.PRODUCTION_AUTH_DOMAIN }}
          REACT_APP_AUTH_CLIENT_ID: ${{ secrets.PRODUCTION_AUTH_CLIENT_ID }}

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-files
          path: build/

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: build-files
          path: build/

      - name: Deploy to S3
        run: aws s3 sync build/ s3://${{ secrets.S3_BUCKET }} --delete
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ${{ secrets.AWS_DEFAULT_REGION }}

      - name: Invalidate CloudFront
        run: aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_DISTRIBUTION_ID }} --paths "/*"
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_DEFAULT_REGION: ${{ secrets.AWS_DEFAULT_REGION }}
```

### GitLab CI/CD

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run test:ci
    - npm run typecheck
    - npm run lint
    - npm audit --audit-level=moderate
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

build:
  stage: build
  image: node:$NODE_VERSION
  script:
    - npm ci
    - npm run build:production
  artifacts:
    paths:
      - build/
    expire_in: 1 hour

deploy:production:
  stage: deploy
  image: amazon/aws-cli:latest
  dependencies:
    - build
  script:
    - aws s3 sync build/ s3://$S3_BUCKET --delete
    - aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"
  only:
    - main
  environment:
    name: production
    url: https://your-domain.com
```

## Environment Variables

### Required Variables

```bash
# API Configuration
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_API_VERSION=v1

# Authentication
REACT_APP_AUTH_DOMAIN=yourdomain.auth0.com
REACT_APP_AUTH_CLIENT_ID=your_client_id
REACT_APP_AUTH_AUDIENCE=your_api_audience

# Feature Flags
REACT_APP_USE_MOCK_API=false
REACT_APP_ENABLE_PLUGIN_HOT_RELOAD=false
REACT_APP_ENABLE_DEVELOPER_TOOLS=false

# Monitoring
REACT_APP_SENTRY_DSN=your_sentry_dsn
REACT_APP_ANALYTICS_ID=your_analytics_id

# Build Information
REACT_APP_VERSION=$npm_package_version
REACT_APP_BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
REACT_APP_GIT_COMMIT=$(git rev-parse HEAD)
```

### Optional Variables

```bash
# Performance Monitoring
REACT_APP_ENABLE_PERFORMANCE_MONITORING=true
REACT_APP_PERFORMANCE_SAMPLE_RATE=0.1

# Debug Features
REACT_APP_DEBUG_MODE=false
REACT_APP_LOG_LEVEL=error

# CDN Configuration
REACT_APP_CDN_URL=https://cdn.yourdomain.com
REACT_APP_ASSET_URL=https://assets.yourdomain.com

# Third-party Services
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_...
REACT_APP_GOOGLE_ANALYTICS_ID=UA-...
REACT_APP_HOTJAR_ID=your_hotjar_id
```

## Performance Optimization

### Bundle Optimization

```javascript
// webpack.config.js optimization
module.exports = {
  optimization: {
    usedExports: true,
    sideEffects: false,
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 250000,
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all'
        },
        plugins: {
          test: /[\\/]src[\\/]plugins[\\/]/,
          name: 'plugins',
          chunks: 'all',
          priority: 0
        }
      }
    }
  }
};
```

### Asset Optimization

```json
{
  "scripts": {
    "optimize:images": "imagemin src/assets/images/* --out-dir=build/static/media",
    "optimize:fonts": "subfont --inline-css build/index.html",
    "analyze:bundle": "npm run build && npx webpack-bundle-analyzer build/static/js/*.js"
  }
}
```

### Service Worker Configuration

```javascript
// public/sw.js
const CACHE_NAME = 'ai-first-saas-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

## Security Considerations

### Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
">
```

### Environment Variable Security

```typescript
// src/utils/security.ts
export function validateEnvironment() {
  const requiredVars = [
    'REACT_APP_API_URL',
    'REACT_APP_AUTH_DOMAIN',
    'REACT_APP_AUTH_CLIENT_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate URLs
  try {
    new URL(process.env.REACT_APP_API_URL!);
  } catch {
    throw new Error('REACT_APP_API_URL must be a valid URL');
  }
}
```

### Security Headers

```nginx
# nginx.conf security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## Monitoring & Logging

### Error Tracking with Sentry

```typescript
// src/utils/monitoring.ts
import * as Sentry from '@sentry/react';
import { Integrations } from '@sentry/tracing';

export function initializeMonitoring() {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      environment: process.env.NODE_ENV,
      release: process.env.REACT_APP_VERSION,
      integrations: [
        new Integrations.BrowserTracing(),
      ],
      tracesSampleRate: parseFloat(process.env.REACT_APP_PERFORMANCE_SAMPLE_RATE || '0.1'),
      beforeSend(event) {
        // Filter out development errors
        if (process.env.NODE_ENV === 'development') {
          return null;
        }
        return event;
      }
    });
  }
}
```

### Analytics Integration

```typescript
// src/utils/analytics.ts
import ReactGA from 'react-ga4';

export function initializeAnalytics() {
  if (process.env.REACT_APP_ANALYTICS_ID) {
    ReactGA.initialize(process.env.REACT_APP_ANALYTICS_ID);
  }
}

export function trackPageView(path: string) {
  if (process.env.REACT_APP_ANALYTICS_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
}

export function trackEvent(category: string, action: string, label?: string) {
  if (process.env.REACT_APP_ANALYTICS_ID) {
    ReactGA.event({
      category,
      action,
      label
    });
  }
}
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export function monitorPerformance() {
  if (process.env.REACT_APP_ENABLE_PERFORMANCE_MONITORING === 'true') {
    // Monitor Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log);
      getFID(console.log);
      getFCP(console.log);
      getLCP(console.log);
      getTTFB(console.log);
    });
  }
}
```

## Rollback Strategies

### Blue-Green Deployment

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh

# Deploy to green environment
aws s3 sync build/ s3://your-app-green --delete

# Run health checks
if curl -f https://green.yourdomain.com/health; then
  echo "Green environment healthy"

  # Switch traffic to green
  aws route53 change-resource-record-sets --hosted-zone-id $HOSTED_ZONE_ID --change-batch file://switch-to-green.json

  echo "Traffic switched to green environment"
else
  echo "Green environment unhealthy, rolling back"
  exit 1
fi
```

### Canary Deployment

```yaml
# canary-deployment.yml
apiVersion: v1
kind: Service
metadata:
  name: app-canary
spec:
  selector:
    app: ai-first-saas
    version: canary
  ports:
    - port: 80
      targetPort: 3000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-first-saas
      version: canary
  template:
    metadata:
      labels:
        app: ai-first-saas
        version: canary
    spec:
      containers:
      - name: app
        image: your-registry.com/ai-first-saas:canary
        ports:
        - containerPort: 3000
```

### Automated Rollback

```javascript
// scripts/rollback.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();
const cloudfront = new AWS.CloudFront();

async function rollback(version) {
  try {
    // Restore previous version from backup
    await s3.sync({
      Bucket: `your-app-backup-${version}`,
      Prefix: '',
      SyncSource: `s3://your-app-production`
    }).promise();

    // Invalidate CloudFront cache
    await cloudfront.createInvalidation({
      DistributionId: process.env.CLOUDFRONT_DISTRIBUTION_ID,
      InvalidationBatch: {
        Paths: { Quantity: 1, Items: ['/*'] },
        CallerReference: Date.now().toString()
      }
    }).promise();

    console.log(`Rollback to version ${version} completed`);
  } catch (error) {
    console.error('Rollback failed:', error);
    process.exit(1);
  }
}

// Usage: node rollback.js v1.2.3
rollback(process.argv[2]);
```

## Multi-Environment Setup

### Environment-specific Configuration

```typescript
// src/config/environments.ts
const environments = {
  development: {
    apiUrl: 'http://localhost:3001',
    enableDevTools: true,
    enableMockApi: true,
    logLevel: 'debug'
  },
  staging: {
    apiUrl: 'https://api-staging.yourdomain.com',
    enableDevTools: true,
    enableMockApi: false,
    logLevel: 'info'
  },
  production: {
    apiUrl: 'https://api.yourdomain.com',
    enableDevTools: false,
    enableMockApi: false,
    logLevel: 'error'
  }
};

export const config = environments[process.env.NODE_ENV as keyof typeof environments] || environments.development;
```

### Infrastructure as Code

```yaml
# terraform/main.tf
provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "app_bucket" {
  for_each = toset(["staging", "production"])

  bucket = "${var.app_name}-${each.key}"

  website {
    index_document = "index.html"
    error_document = "index.html"
  }
}

resource "aws_cloudfront_distribution" "app_distribution" {
  for_each = aws_s3_bucket.app_bucket

  origin {
    domain_name = each.value.bucket_domain_name
    origin_id   = "S3-${each.value.bucket}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.app_oai[each.key].cloudfront_access_identity_path
    }
  }

  enabled             = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${each.value.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }
}
```

## Plugin Deployment

### Plugin Bundle Management

```typescript
// src/core/plugins/PluginDeployment.ts
export class PluginDeployment {
  async deployPlugin(pluginId: string, version: string) {
    try {
      // Download plugin bundle
      const bundle = await this.downloadPluginBundle(pluginId, version);

      // Validate plugin signature
      await this.validatePluginSignature(bundle);

      // Install plugin
      await this.installPlugin(bundle);

      // Run health checks
      await this.runPluginHealthChecks(pluginId);

      return { success: true };
    } catch (error) {
      console.error(`Plugin deployment failed:`, error);
      throw error;
    }
  }

  private async downloadPluginBundle(pluginId: string, version: string) {
    const response = await fetch(`${config.pluginRegistry}/${pluginId}/${version}/bundle.js`);
    if (!response.ok) {
      throw new Error(`Failed to download plugin bundle: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }

  private async validatePluginSignature(bundle: ArrayBuffer) {
    // Implement plugin signature validation
    // This ensures plugins are from trusted sources
  }
}
```

### Plugin Registry

```yaml
# Plugin registry configuration
plugins:
  user-management:
    latest: "2.1.0"
    versions:
      - "2.1.0"
      - "2.0.1"
      - "2.0.0"
    compatibility:
      framework: ">=1.0.0"

  dashboard:
    latest: "1.5.2"
    versions:
      - "1.5.2"
      - "1.5.1"
    compatibility:
      framework: ">=1.0.0"
```

## Troubleshooting

### Common Deployment Issues

#### Build Failures

```bash
# Check Node.js version
node --version  # Should be 18+

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run typecheck

# Check for dependency conflicts
npm ls
```

#### Environment Variable Issues

```bash
# Verify environment variables are set
env | grep REACT_APP

# Check build output for missing variables
npm run build 2>&1 | grep -i "environment"
```

#### Bundle Size Issues

```bash
# Analyze bundle size
npm run build:analyze

# Check for large dependencies
npx webpack-bundle-analyzer build/static/js/*.js
```

### Performance Issues

```typescript
// Debug performance issues
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  console.log('Performance metric:', metric);

  // Send to your analytics service
  if (metric.value > thresholds[metric.name]) {
    console.warn(`Performance issue detected: ${metric.name} = ${metric.value}`);
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Deployment Health Checks

```typescript
// src/utils/healthCheck.ts
export async function performHealthCheck() {
  const checks = [
    { name: 'API', check: () => fetch('/api/health') },
    { name: 'Auth', check: () => authService.ping() },
    { name: 'Plugins', check: () => pluginManager.healthCheck() }
  ];

  const results = await Promise.allSettled(
    checks.map(async ({ name, check }) => {
      try {
        await check();
        return { name, status: 'healthy' };
      } catch (error) {
        return { name, status: 'unhealthy', error: error.message };
      }
    })
  );

  return results.map(result =>
    result.status === 'fulfilled' ? result.value : result.reason
  );
}
```

This comprehensive deployment guide ensures successful production deployments of the AI-First SaaS React Starter framework across various platforms and environments.