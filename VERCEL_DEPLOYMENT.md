# Vercel Deployment Guide

This guide covers deploying the MD Sports application to Vercel with optimal performance configurations.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Neon Database**: Ensure your Neon database is set up and accessible
3. **GitHub Repository**: Your code should be in a GitHub repository

## Environment Variables Setup

### Required Environment Variables

Set these in your Vercel Dashboard under Project Settings > Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database?connection_limit=1&pool_timeout=0&connect_timeout=60
DIRECT_URL=postgresql://username:password@host:port/database

# Authentication
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
JWT_SECRET=your-jwt-secret

# Vercel KV (Required for caching)
KV_REST_API_URL=https://your-kv-instance.upstash.io
KV_REST_API_TOKEN=your-kv-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-readonly-token

# Optional
NODE_ENV=production
ENABLE_PERFORMANCE_MONITORING=true
ENABLE_REALTIME_UPDATES=true
```

### Setting up Vercel KV

1. Go to Vercel Dashboard > Storage
2. Create a new KV Database
3. Copy the connection details to your environment variables
4. The KV database provides Redis-compatible caching for serverless functions

## Deployment Steps

### 1. Connect Repository

1. Go to Vercel Dashboard
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing your MD Sports application

### 2. Configure Build Settings

Vercel should automatically detect Next.js. Verify these settings:

- **Framework Preset**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### 3. Set Environment Variables

1. Go to Project Settings > Environment Variables
2. Add all required environment variables from the list above
3. Make sure to set the correct `NEXTAUTH_URL` to your Vercel domain

### 4. Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Your application will be available at `https://your-app.vercel.app`

## Performance Optimizations Implemented

### 1. Serverless Function Optimizations

- **Runtime Configuration**: All API routes use `nodejs` runtime
- **Dynamic Rendering**: Force dynamic for real-time data
- **Timeout Settings**: 10-second max duration for API routes
- **Memory Optimization**: Efficient Prisma connection pooling

### 2. Database Optimizations

- **Connection Pooling**: Limited to 1 connection per function
- **Connection Timeout**: 60 seconds for reliable connections
- **Pool Timeout**: 0 for immediate connection attempts
- **Query Optimization**: Efficient queries with proper indexing

### 3. Caching Strategy

- **Vercel KV**: Redis-compatible caching for serverless
- **Multi-layer Caching**: Memory + Redis for optimal performance
- **Smart TTL**: Different cache durations for different data types
- **Cache Invalidation**: Automatic cache updates on data changes

### 4. Real-time Updates

- **Polling-based**: Replaces Socket.IO for serverless compatibility
- **Efficient Polling**: 5-second intervals with smart filtering
- **Update Batching**: Multiple updates sent together
- **Type-specific Subscriptions**: Subscribe only to needed update types

### 5. API Route Optimizations

- **Response Compression**: Enabled for all API responses
- **Proper Headers**: Cache control and content type headers
- **Error Handling**: Comprehensive error handling and logging
- **Performance Monitoring**: Built-in performance tracking

## Monitoring and Analytics

### Vercel Analytics

Enable Vercel Analytics for performance insights:

1. Go to Project Settings > Analytics
2. Enable Web Analytics
3. Enable Speed Insights
4. Monitor Core Web Vitals and performance metrics

### Performance Monitoring

The application includes built-in performance monitoring:

- API response times
- Database query performance
- Cache hit/miss rates
- Real-time update efficiency

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify `DATABASE_URL` includes connection pooling parameters
   - Check Neon database is accessible from Vercel
   - Ensure connection limits are properly configured

2. **Cache Issues**
   - Verify Vercel KV is properly configured
   - Check KV connection credentials
   - Monitor cache performance in Vercel dashboard

3. **Real-time Updates Not Working**
   - Verify authentication tokens are valid
   - Check polling interval settings
   - Monitor network requests in browser dev tools

4. **Slow Performance**
   - Check database query performance
   - Monitor cache hit rates
   - Review Vercel function logs
   - Optimize heavy API routes

### Performance Monitoring

Use these endpoints to monitor application health:

- `GET /api/health` - Overall application health
- `GET /api/dashboard/optimized` - Optimized dashboard data
- `GET /api/invoices/optimized` - Optimized invoice data
- `GET /api/realtime` - Real-time updates status

### Logs and Debugging

1. **Vercel Function Logs**
   - Go to Project Dashboard > Functions
   - Click on any function to view logs
   - Monitor errors and performance metrics

2. **Real-time Monitoring**
   - Use Vercel Analytics for user experience metrics
   - Monitor API response times
   - Track database performance

## Best Practices

### 1. Database Queries

- Use `select` to limit returned fields
- Implement proper pagination
- Use database indexes for frequently queried fields
- Avoid N+1 query problems

### 2. Caching

- Cache expensive computations
- Use appropriate TTL values
- Implement cache invalidation strategies
- Monitor cache hit rates

### 3. API Design

- Keep API responses small
- Use proper HTTP status codes
- Implement request/response compression
- Add proper error handling

### 4. Real-time Updates

- Subscribe only to necessary update types
- Use appropriate polling intervals
- Implement connection retry logic
- Handle offline scenarios

## Scaling Considerations

### Vercel Limits (Hobby Plan)

- **Function Duration**: 10 seconds max
- **Memory**: 1024 MB
- **Bandwidth**: 100 GB/month
- **Function Invocations**: 100,000/month
- **Concurrent Executions**: 1,000

### Upgrade Recommendations

Consider upgrading to Vercel Pro if you experience:

- Function timeout errors
- High bandwidth usage
- Need for longer function execution times
- Requirement for more concurrent executions

### Database Scaling

- Monitor Neon database performance
- Consider read replicas for heavy read workloads
- Implement database connection pooling
- Use database indexes effectively

## Security Considerations

1. **Environment Variables**
   - Never commit secrets to repository
   - Use Vercel's environment variable management
   - Rotate secrets regularly

2. **API Security**
   - Implement proper authentication
   - Use HTTPS for all communications
   - Validate all input data
   - Implement rate limiting

3. **Database Security**
   - Use connection strings with proper credentials
   - Implement row-level security if needed
   - Monitor database access logs

## Support and Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Neon Documentation](https://neon.tech/docs)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)

For additional support, check the application logs and monitoring dashboards for specific error messages and performance metrics.