# SWMS Deployment Guide for Vercel

## 🚀 Quick Deployment Steps

### 1. Push to GitHub

```bash
# Initialize Git repository
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial commit: Complete SWMS web application"

# Add GitHub remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/swms-web.git

# Push to GitHub
git push -u origin main
```

### 2. Deploy on Vercel

1. **Go to [vercel.com](https://vercel.com)**
2. **Sign up/Login** with your GitHub account
3. **Import Project** from your GitHub repository
4. **Configure Environment Variables:**

#### Required Environment Variables:
```
NODE_ENV=production
JWT_SECRET=your_super_secure_jwt_secret_for_production
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-app-name.vercel.app

# Database (use a cloud PostgreSQL service)
DB_HOST=your-database-host
DB_PORT=5432
DB_NAME=swms_db
DB_USER=your-db-username
DB_PASSWORD=your-db-password
```

### 3. Database Setup (Cloud Options)

#### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL service
4. Copy connection details to Vercel environment variables

#### Option B: Supabase
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Get database URL from settings
4. Use connection details in Vercel

#### Option C: Neon
1. Go to [neon.tech](https://neon.tech)
2. Create database
3. Copy connection string
4. Configure in Vercel environment variables

### 4. Initialize Database Schema

After database setup, run SQL schema:

```sql
-- Use the schema from backend/database/schema.sql
-- And sample data from backend/database/seeds.sql
```

### 5. Vercel Configuration

The `vercel.json` file is already configured for:
- Backend API routes (`/api/*`)
- Frontend static files
- Automatic builds

### 6. Access Your Application

After deployment:
- **Frontend**: `https://your-app-name.vercel.app`
- **Backend API**: `https://your-app-name.vercel.app/api`

### 7. Default Login Credentials

- **Admin**: username: `admin_swms`, password: `swmsewu2025`
- **Student**: username: `john_doe`, password: `student123`
- **Faculty**: username: `jane_smith`, password: `faculty123`
- **Consultant**: username: `dr_johnson`, password: `consultant123`

## 📝 Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test database connection
- [ ] Run database schema and seeds
- [ ] Test all user role logins
- [ ] Verify API endpoints work
- [ ] Test frontend functionality

## 🔧 Troubleshooting

### Common Issues:

1. **Database Connection Error**
   - Check environment variables
   - Verify database URL format
   - Ensure database is accessible

2. **API Routes Not Working**
   - Check `vercel.json` configuration
   - Verify backend routes start with `/api`

3. **Frontend Build Errors**
   - Check React version compatibility
   - Review console for specific errors

4. **CORS Issues**
   - Update `CORS_ORIGIN` environment variable
   - Match exact Vercel app URL

## 🌟 Features Deployed

✅ **Admin Dashboard** - Complete user management
✅ **Student Interface** - Mood tracking and appointments  
✅ **Faculty Tools** - Student monitoring and recommendations
✅ **Consultant Panel** - Appointment and session management
✅ **Authentication** - JWT-based security
✅ **Database** - PostgreSQL with full schema
✅ **Responsive UI** - Bootstrap-based design

Your SWMS application is now ready for production use!
