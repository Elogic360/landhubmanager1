# Database Connection Troubleshooting Guide

## Current Issues:
1. Network unreachable error when connecting to Supabase
2. Health checks failing due to database dependency
3. Frontend can't load plots due to 503 API responses

## Immediate Fixes Applied:
✅ Separated basic health check from database health check
✅ Added missing /api/plots/ordered endpoint
✅ Fixed route ordering to prevent UUID parsing errors
✅ Improved connection handling with retry logic

## Next Steps to Fix Database Connection:

### 1. Check Supabase Project Status
- Login to https://supabase.com
- Verify your project "htspogbdpbqrzkghuebx" is active
- Check if it's paused due to inactivity
- Ensure it hasn't exceeded free tier limits

### 2. Verify Database URL in Render Environment Variables
Your Render service needs these environment variables:
```
DATABASE_URL=postgresql://postgres:thelandhub101@db.htspogbdpbqrzkghuebx.supabase.co:5432/postgres
SUPABASE_URL=https://htspogbdpbqrzkghuebx.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Alternative Solutions if Supabase Doesn't Work:

#### Option A: Use Render PostgreSQL
- Add a PostgreSQL database to your Render service
- Update DATABASE_URL to use Render's internal database
- Much more reliable for Render deployments

#### Option B: Use Different Database Provider
- Railway PostgreSQL
- Neon PostgreSQL  
- PlanetScale (MySQL)

### 4. Test Database Connection
Once deployed, test:
```bash
curl https://landhubmanager.onrender.com/health      # Should return 200 now
curl https://landhubmanager.onrender.com/health/db   # Will show database status
```

## Expected Results After Current Fix:
- ✅ Basic health check returns 200 OK
- ✅ Frontend can connect to API
- ✅ /api/plots/ordered endpoint works
- ⚠️  Database-dependent endpoints still need DB fix

## Priority Actions:
1. Wait for current deployment to complete (~2-3 minutes)
2. Test basic health endpoint
3. Check Supabase project status
4. Update Render environment variables if needed
5. Consider switching to Render PostgreSQL for reliability
