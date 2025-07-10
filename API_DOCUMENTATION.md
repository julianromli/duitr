# API Documentation - Duitr

Dokumentasi lengkap untuk API dan integrasi database Supabase pada aplikasi Duitr.

## 📋 Daftar Isi

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Real-time Subscriptions](#real-time-subscriptions)
6. [Error Handling](#error-handling)
7. [Rate Limiting](#rate-limiting)
8. [Security](#security)

## 🔍 Overview

Duitr menggunakan Supabase sebagai Backend-as-a-Service yang menyediakan:

- **PostgreSQL Database** - Database relasional dengan Row Level Security
- **Authentication** - JWT-based authentication
- **Real-time** - WebSocket subscriptions untuk data real-time
- **Storage** - File upload dan management
- **Edge Functions** - Serverless functions (future use)

### Base Configuration

```typescript
// Supabase Client Configuration
const supabaseUrl = 'https://your-project.supabase.co'
const supabaseAnonKey = 'your-anon-key'

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

## 🔐 Authentication

### Auth Endpoints

#### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: 'John Doe'
    }
  }
})
```

**Response:**
```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "user_metadata": {
        "full_name": "John Doe"
      }
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_in": 3600
    }
  },
  "error": null
}
```

#### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

#### Sign Out
```typescript
const { error } = await supabase.auth.signOut()
```

#### Password Reset
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://yourapp.com/reset-password'
  }
)
```

### Auth State Management

```typescript
// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user)
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  }
})

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

## 🗄️ Database Schema

### Tables Overview

| Table | Description | Relations |
|-------|-------------|----------|
| `users` | User profiles | - |
| `wallets` | User wallets | `users.id` |
| `categories` | Transaction categories | - |
| `transactions` | Financial transactions | `users.id`, `wallets.id`, `categories.id` |
| `budgets` | User budgets | `users.id`, `categories.id` |
| `want_to_buy` | Wishlist items | `users.id` |
| `pinjaman` | Loan records | `users.id` |

### Detailed Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Wallets Table
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0,
  color VARCHAR(7),
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Categories Table
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  icon VARCHAR(50),
  color VARCHAR(7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wallet_id UUID REFERENCES wallets(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  amount DECIMAL(15,2) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  description TEXT,
  date DATE NOT NULL,
  to_wallet_id UUID REFERENCES wallets(id), -- For transfers
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Budgets Table
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  name VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  period VARCHAR(20) DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔌 API Endpoints

### Transactions API

#### Get All Transactions
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    *,
    wallet:wallets(name, type, color),
    category:categories(name, icon, color)
  `)
  .eq('user_id', userId)
  .order('date', { ascending: false })
  .range(0, 49) // Pagination
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "wallet_id": "uuid",
      "category_id": 1,
      "amount": 50000,
      "type": "expense",
      "description": "Lunch at restaurant",
      "date": "2024-01-15",
      "created_at": "2024-01-15T12:00:00Z",
      "wallet": {
        "name": "Cash",
        "type": "cash",
        "color": "#10B981"
      },
      "category": {
        "name": "Food & Dining",
        "icon": "utensils",
        "color": "#F59E0B"
      }
    }
  ],
  "error": null
}
```

#### Create Transaction
```typescript
const { data, error } = await supabase
  .from('transactions')
  .insert({
    user_id: userId,
    wallet_id: walletId,
    category_id: categoryId,
    amount: 50000,
    type: 'expense',
    description: 'Lunch at restaurant',
    date: '2024-01-15'
  })
  .select()
  .single()
```

#### Update Transaction
```typescript
const { data, error } = await supabase
  .from('transactions')
  .update({
    amount: 75000,
    description: 'Updated description'
  })
  .eq('id', transactionId)
  .eq('user_id', userId)
  .select()
  .single()
```

#### Delete Transaction
```typescript
const { error } = await supabase
  .from('transactions')
  .delete()
  .eq('id', transactionId)
  .eq('user_id', userId)
```

### Wallets API

#### Get All Wallets
```typescript
const { data, error } = await supabase
  .from('wallets')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: true })
```

#### Create Wallet
```typescript
const { data, error } = await supabase
  .from('wallets')
  .insert({
    user_id: userId,
    name: 'My Bank Account',
    type: 'bank',
    balance: 1000000,
    color: '#3B82F6',
    icon: 'credit-card'
  })
  .select()
  .single()
```

#### Update Wallet Balance
```typescript
const { data, error } = await supabase
  .from('wallets')
  .update({ balance: newBalance })
  .eq('id', walletId)
  .eq('user_id', userId)
  .select()
  .single()
```

### Categories API

#### Get All Categories
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .order('name', { ascending: true })
```

#### Get Categories by Type
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('type', 'expense')
  .order('name', { ascending: true })
```

### Budgets API

#### Get User Budgets
```typescript
const { data, error } = await supabase
  .from('budgets')
  .select(`
    *,
    category:categories(name, icon, color)
  `)
  .eq('user_id', userId)
  .gte('end_date', new Date().toISOString().split('T')[0])
  .order('created_at', { ascending: false })
```

#### Create Budget
```typescript
const { data, error } = await supabase
  .from('budgets')
  .insert({
    user_id: userId,
    category_id: categoryId,
    name: 'Monthly Food Budget',
    amount: 2000000,
    period: 'monthly',
    start_date: '2024-01-01',
    end_date: '2024-01-31'
  })
  .select()
  .single()
```

### Advanced Queries

#### Get Transaction Summary by Category
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    category_id,
    categories(name, icon, color),
    amount.sum()
  `)
  .eq('user_id', userId)
  .eq('type', 'expense')
  .gte('date', startDate)
  .lte('date', endDate)
  .group('category_id, categories.name, categories.icon, categories.color')
```

#### Get Monthly Spending Trend
```typescript
const { data, error } = await supabase
  .from('transactions')
  .select(`
    date,
    amount.sum()
  `)
  .eq('user_id', userId)
  .eq('type', 'expense')
  .gte('date', startDate)
  .lte('date', endDate)
  .group('date')
  .order('date', { ascending: true })
```

## 🔄 Real-time Subscriptions

### Subscribe to Transaction Changes
```typescript
const subscription = supabase
  .channel('transactions')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'transactions',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Transaction change:', payload)
      // Update local state
      queryClient.invalidateQueries(['transactions'])
    }
  )
  .subscribe()

// Cleanup
return () => {
  subscription.unsubscribe()
}
```

### Subscribe to Wallet Balance Changes
```typescript
const subscription = supabase
  .channel('wallets')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'wallets',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      console.log('Wallet balance updated:', payload.new)
      // Update wallet balance in UI
      queryClient.setQueryData(['wallets'], (old: Wallet[]) => 
        old?.map(wallet => 
          wallet.id === payload.new.id 
            ? { ...wallet, balance: payload.new.balance }
            : wallet
        )
      )
    }
  )
  .subscribe()
```

## ❌ Error Handling

### Common Error Types

```typescript
interface SupabaseError {
  message: string
  details: string
  hint: string
  code: string
}
```

### Error Codes

| Code | Description | Action |
|------|-------------|--------|
| `23505` | Unique constraint violation | Show user-friendly message |
| `23503` | Foreign key constraint violation | Validate references |
| `42501` | Insufficient privilege | Check RLS policies |
| `PGRST116` | Row not found | Handle gracefully |

### Error Handling Pattern

```typescript
const handleSupabaseError = (error: SupabaseError) => {
  switch (error.code) {
    case '23505':
      return 'This record already exists'
    case '23503':
      return 'Invalid reference to related data'
    case '42501':
      return 'You do not have permission to perform this action'
    case 'PGRST116':
      return 'Record not found'
    default:
      return error.message || 'An unexpected error occurred'
  }
}

// Usage in service
try {
  const { data, error } = await supabase
    .from('transactions')
    .insert(transactionData)
  
  if (error) throw error
  return data
} catch (error) {
  const message = handleSupabaseError(error as SupabaseError)
  throw new Error(message)
}
```

## 🚦 Rate Limiting

Supabase implements rate limiting to prevent abuse:

- **Authentication**: 30 requests per hour per IP
- **Database**: 200 requests per minute per API key
- **Real-time**: 100 concurrent connections per project

### Handling Rate Limits

```typescript
const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const data = await withRetry(() => 
  supabase.from('transactions').select('*')
)
```

## 🔒 Security

### Row Level Security (RLS)

Semua tabel menggunakan RLS untuk memastikan data isolation:

```sql
-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to access their own data
CREATE POLICY "Users can access own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

-- Policy for reading categories (public)
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);
```

### Input Validation

```typescript
// Zod schema for transaction validation
const transactionSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer']),
  description: z.string().max(255, 'Description too long'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  wallet_id: z.string().uuid('Invalid wallet ID'),
  category_id: z.number().int().positive('Invalid category ID')
})

// Validate before API call
const validateTransaction = (data: unknown) => {
  try {
    return transactionSchema.parse(data)
  } catch (error) {
    throw new Error('Invalid transaction data')
  }
}
```

### API Key Security

```typescript
// Environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Never expose service role key in frontend
// Use anon key with RLS policies instead
```

### Content Security Policy

```html
<!-- Add to index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  img-src 'self' data: https:;
  font-src 'self' data:;
">
```

## 📊 Performance Optimization

### Database Indexes

```sql
-- Indexes for better query performance
CREATE INDEX idx_transactions_user_date ON transactions(user_id, date DESC);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_transactions_category ON transactions(category_id);
CREATE INDEX idx_wallets_user ON wallets(user_id);
CREATE INDEX idx_budgets_user_period ON budgets(user_id, start_date, end_date);
```

### Query Optimization

```typescript
// Use select() to limit returned columns
const { data } = await supabase
  .from('transactions')
  .select('id, amount, date, description') // Only needed columns
  .eq('user_id', userId)

// Use range() for pagination
const { data } = await supabase
  .from('transactions')
  .select('*')
  .range(0, 19) // First 20 records

// Use single() when expecting one result
const { data } = await supabase
  .from('wallets')
  .select('*')
  .eq('id', walletId)
  .single()
```

### Caching Strategy

```typescript
// React Query configuration for optimal caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        return failureCount < 3
      }
    }
  }
})
```

---

## 📝 API Reference Summary

### Base URL
```
https://your-project.supabase.co/rest/v1/
```

### Headers
```
Authorization: Bearer <jwt_token>
apikey: <anon_key>
Content-Type: application/json
Prefer: return=representation
```

### Common Response Format
```json
{
  "data": [...], // or single object
  "error": null,
  "count": 100, // if count requested
  "status": 200,
  "statusText": "OK"
}
```

Untuk informasi lebih detail, kunjungi [Supabase Documentation](https://supabase.com/docs) dan [PostgREST API Reference](https://postgrest.org/en/stable/api.html).