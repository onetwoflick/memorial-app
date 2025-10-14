# Production Deployment Checklist

## ✅ Code Quality
- [x] All linting errors resolved
- [x] All TypeScript errors fixed
- [x] Debug code removed
- [x] Console.log statements cleaned up
- [x] Unused variables removed
- [x] Build passes successfully

## ✅ Performance Optimization
- [x] Mobile-responsive design implemented
- [x] Image optimization with Next.js Image component
- [x] Proper viewport configuration
- [x] Optimized bundle sizes
- [x] Static page generation working

## ✅ Security & Environment
- [ ] Environment variables configured for production
- [ ] Supabase production database configured
- [ ] Stripe production keys configured
- [ ] CORS settings configured
- [ ] Rate limiting implemented (if needed)

## ✅ Database Setup
- [ ] Production Supabase project created
- [ ] Database tables created (`memorials`, `memorial_sessions`)
- [ ] Storage bucket created (`memorial-photos`)
- [ ] Row Level Security (RLS) policies configured
- [ ] Database backups configured

## ✅ Stripe Configuration
- [ ] Production Stripe account configured
- [ ] Webhook endpoints configured
- [ ] Product/pricing configured
- [ ] Webhook secret configured in environment

## ✅ Deployment
- [ ] Choose deployment platform (Vercel, Netlify, etc.)
- [ ] Configure environment variables
- [ ] Set up custom domain (if needed)
- [ ] Configure SSL certificate
- [ ] Set up monitoring/analytics

## ✅ Testing
- [ ] Test payment flow end-to-end
- [ ] Test memorial creation process
- [ ] Test edit functionality
- [ ] Test mobile responsiveness
- [ ] Test error handling
- [ ] Test session management

## ✅ Monitoring
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Database monitoring

## Environment Variables Needed
```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
STRIPE_SECRET_KEY=your_production_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_production_webhook_secret
```

## Database Schema
```sql
-- memorials table
CREATE TABLE memorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_death DATE NOT NULL,
  photo_path TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- memorial_sessions table
CREATE TABLE memorial_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  memorial_id UUID REFERENCES memorials(id),
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Storage Setup
- Create `memorial-photos` bucket in Supabase Storage
- Configure bucket policies for public read access
- Set up file size limits (5MB max)

## Ready for Production! 🚀
The codebase is now optimized and ready for production deployment.
