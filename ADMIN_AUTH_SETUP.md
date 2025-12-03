# Admin Authentication Setup Guide
# دليل إعداد مصادقة المدير

## Overview
## نظرة عامة

This system ensures that only users with `role = 'admin'` in the Supabase `users` table can access the admin dashboard. All login methods (email/password, magic link, Google OAuth, GitHub OAuth) verify the admin role before granting access.

يضمن هذا النظام أن المستخدمين الذين لديهم `role = 'admin'` في جدول `users` في Supabase فقط يمكنهم الوصول إلى لوحة تحكم المدير. جميع طرق تسجيل الدخول (البريد/كلمة المرور، الرابط السحري، Google OAuth، GitHub OAuth) تتحقق من دور المدير قبل منح الوصول.

## Supabase Table Setup
## إعداد جدول Supabase

### 1. Create the `users` table
### 1. إنشاء جدول `users`

Run the following SQL in your Supabase SQL Editor:

قم بتشغيل SQL التالي في محرر SQL في Supabase:

```sql
-- Create users table
-- إنشاء جدول users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on role for faster queries
-- إنشاء فهرس على role للاستعلامات الأسرع
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create index on email
-- إنشاء فهرس على email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable Row Level Security (RLS)
-- تفعيل أمان مستوى الصف (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
-- سياسة: يمكن للمستخدمين قراءة ملفهم الشخصي
CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Allow authenticated users to read all users (for admin checks)
-- سياسة: السماح للمستخدمين المصادق عليهم بقراءة جميع المستخدمين (للتحقق من المدير)
CREATE POLICY "Authenticated users can read users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Only service role can insert/update users (prevents auto-creation)
-- سياسة: فقط service role يمكنه إدراج/تحديث المستخدمين (يمنع الإنشاء التلقائي)
-- Note: You'll need to create users manually or via a backend service
-- ملاحظة: ستحتاج إلى إنشاء المستخدمين يدوياً أو عبر خدمة backend
```

### 2. Create Admin User
### 2. إنشاء مستخدم مدير

#### Option A: Manual Creation via Supabase Dashboard
#### الخيار أ: الإنشاء اليدوي عبر لوحة تحكم Supabase

1. Go to **Authentication** > **Users** in Supabase Dashboard
2. Click **Add user** > **Create new user**
3. Enter:
   - **Email**: admin@example.com
   - **Password**: (choose a strong password)
4. Click **Create user**
5. Copy the user's UUID (ID)

6. Go to **Table Editor** > **users** table
7. Click **Insert row**
8. Enter:
   - **id**: (paste the UUID from step 5)
   - **email**: admin@example.com
   - **name**: Admin User (optional)
   - **role**: admin
9. Click **Save**

#### Option B: SQL Insert
#### الخيار ب: إدراج SQL

```sql
-- First, create the auth user (you'll need to do this via Supabase Dashboard or API)
-- أولاً، قم بإنشاء مستخدم auth (ستحتاج إلى القيام بذلك عبر لوحة تحكم Supabase أو API)

-- Then insert into users table (replace USER_UUID with actual UUID)
-- ثم أدخل في جدول users (استبدل USER_UUID بالمعرف الفعلي)
INSERT INTO users (id, email, name, role)
VALUES (
    'USER_UUID_HERE',  -- Replace with actual user UUID from auth.users
    'admin@example.com',
    'Admin User',
    'admin'
);
```

### 3. Function to Sync Auth Users (Optional)
### 3. دالة لمزامنة مستخدمي Auth (اختياري)

If you want to automatically create a users table entry when a user signs up (but still require manual role assignment), you can use a database trigger:

إذا كنت تريد إنشاء إدخال في جدول users تلقائياً عند تسجيل المستخدم (لكن لا يزال يتطلب تعيين الدور يدوياً)، يمكنك استخدام trigger قاعدة البيانات:

```sql
-- Function to create users table entry on auth user creation
-- دالة لإنشاء إدخال في جدول users عند إنشاء مستخدم auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, role)
    VALUES (
        NEW.id,
        NEW.email,
        'user'  -- Default role is 'user', must be changed to 'admin' manually
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function
-- Trigger لاستدعاء الدالة
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Important**: Even with this trigger, users will have `role = 'user'` by default. You must manually update their role to `'admin'` in the users table for them to access the dashboard.

**مهم**: حتى مع هذا الـ trigger، سيكون للمستخدمين `role = 'user'` افتراضياً. يجب عليك تحديث دورهم يدوياً إلى `'admin'` في جدول users للسماح لهم بالوصول إلى لوحة التحكم.

## Authentication Flow
## تدفق المصادقة

### Email/Password Login
### تسجيل الدخول بالبريد/كلمة المرور

1. User enters email and password
2. System authenticates with Supabase Auth
3. System checks `users` table for `role = 'admin'`
4. If admin → Allow access to dashboard
5. If not admin → Sign out and show error: "ليس لديك صلاحية للوصول إلى لوحة التحكم."

### Magic Link Login
### تسجيل الدخول بالرابط السحري

1. User requests magic link
2. System sends magic link email
3. User clicks link → redirected to login page
4. System authenticates session
5. System checks `users` table for `role = 'admin'`
6. If admin → Allow access to dashboard
7. If not admin → Sign out and show error

### OAuth (Google/GitHub)
### OAuth (Google/GitHub)

1. User clicks OAuth button
2. Redirected to OAuth provider
3. User authorizes → redirected back to login page
4. System authenticates session
5. System checks `users` table for `role = 'admin'`
6. If admin → Allow access to dashboard
7. If not admin → Sign out and show error

**Note**: For OAuth users, you must manually create their entry in the `users` table with `role = 'admin'` after they first authenticate.

**ملاحظة**: لمستخدمي OAuth، يجب عليك إنشاء إدخالهم يدوياً في جدول `users` مع `role = 'admin'` بعد أول مصادقة لهم.

## Dashboard Protection
## حماية لوحة التحكم

Every dashboard page calls `protectAdminPage()` which:

كل صفحة في لوحة التحكم تستدعي `protectAdminPage()` التي:

1. Verifies session exists
2. Verifies user exists in `users` table
3. Verifies `role = 'admin'`
4. If any check fails → Sign out and redirect to login/home

## Functions Available
## الدوال المتاحة

### `getCurrentAdmin()`
Returns the full admin profile from the `users` table:
- `id`: User UUID
- `email`: User email
- `name`: User name
- `role`: User role (should be 'admin')
- All other fields from users table

### `verifyAdminRole(userId)`
Checks if a user has admin role:
- Returns: `{ isAdmin: boolean, user: object | null }`

### `protectAdminPage()`
Protects dashboard pages:
- Verifies session
- Verifies admin role
- Returns `true` if authorized, `false` otherwise

## Error Messages
## رسائل الخطأ

- **Non-admin login attempt**: "ليس لديك صلاحية للوصول إلى لوحة التحكم."
- **Session expired**: Redirects to login page
- **No session**: Redirects to login page

## Security Notes
## ملاحظات الأمان

1. **No Auto-Creation**: The system does NOT automatically create users in the `users` table. All users must be created manually or via a backend service.

2. **Role Verification**: Every dashboard access checks the `role` column in the `users` table, not just the auth session.

3. **Sign Out on Failure**: Non-admin users are automatically signed out when they attempt to access the dashboard.

4. **RLS Policies**: The `users` table has Row Level Security enabled. Make sure your policies allow authenticated users to read the table for role verification.

## Testing
## الاختبار

1. Create a test admin user in Supabase
2. Try logging in with email/password → Should succeed
3. Create a test non-admin user (role = 'user')
4. Try logging in → Should fail with error message
5. Try accessing dashboard directly → Should redirect to login

## Troubleshooting
## استكشاف الأخطاء

### "User is not admin or not found"
- Check that the user exists in the `users` table
- Check that `role = 'admin'` (case-sensitive)
- Check that the `id` in `users` table matches the `id` in `auth.users`

### OAuth users can't access dashboard
- OAuth users must be manually added to the `users` table
- Make sure their `id` matches their `auth.users.id`
- Set their `role = 'admin'`

### Magic link doesn't work
- Check that the redirect URL is correct
- Verify the callback handler is being called
- Check browser console for errors

