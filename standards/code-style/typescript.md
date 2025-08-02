# TypeScript Style Guide

## Configuration

### TypeScript Config
- **Enable strict mode** in `tsconfig.json`
- **Use latest TypeScript version**
- **Enable all strict checks**

```json
{
	"compilerOptions": {
		"strict": true,
		"noImplicitAny": true,
		"strictNullChecks": true,
		"strictFunctionTypes": true,
		"noImplicitReturns": true,
		"noUnusedLocals": true,
		"noUnusedParameters": true
	}
}
```

## Type Definitions

### Interfaces vs Types
- **Prefer interfaces** for object structures
- **Use types** for unions, primitives, and computed types
- **Use interface** when extending is needed

```typescript
// ✅ Good - Interface for objects
interface User {
	id: string
	name: string
	email: string
}

interface AdminUser extends User {
	permissions: string[]
}

// ✅ Good - Type for unions
type Status = 'loading' | 'success' | 'error'
type Theme = 'light' | 'dark'

// ✅ Good - Type for computed types
type UserKeys = keyof User
type PartialUser = Partial<User>
```

### Naming Conventions
- **PascalCase** for interfaces and types
- **camelCase** for properties and methods
- **Descriptive names** over abbreviations

```typescript
// ✅ Good
interface UserProfile {
	firstName: string
	lastName: string
	isActive: boolean
}

type ApiResponse<T> = {
	data: T
	status: number
	message: string
}

// ❌ Bad
interface UP {
	fn: string
	ln: string
	active: boolean
}
```

### Generic Types
- **Use descriptive generic names**
- **Constrain generics** when appropriate
- **Provide default types** when sensible

```typescript
// ✅ Good - Descriptive generic names
interface Repository<TEntity, TKey = string> {
	findById(id: TKey): Promise<TEntity | null>
	save(entity: TEntity): Promise<TEntity>
	delete(id: TKey): Promise<void>
}

// ✅ Good - Constrained generics
interface Comparable<T> {
	compareTo(other: T): number
}

function sort<T extends Comparable<T>>(items: T[]): T[] {
	return items.sort((a, b) => a.compareTo(b))
}

// ❌ Bad - Single letter generics without context
interface Thing<T, U, V> {
	a: T
	b: U
	c: V
}
```

## Utility Types

### Built-in Utility Types
- **Partial<T>** - Make all properties optional
- **Pick<T, K>** - Select specific properties
- **Omit<T, K>** - Exclude specific properties
- **Record<K, T>** - Create object type with specific keys

```typescript
// ✅ Good - Using utility types
interface User {
	id: string
	name: string
	email: string
	password: string
}

// For API responses (exclude sensitive data)
type PublicUser = Omit<User, 'password'>

// For user updates (make fields optional)
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>

// For form data
type UserForm = Pick<User, 'name' | 'email'>

// For lookup tables
type UserLookup = Record<string, PublicUser>
```

### Custom Utility Types
- **Create reusable utility types**
- **Document complex types**
- **Use mapped types** for transformations

```typescript
// ✅ Good - Custom utility types
/**
 * Makes specified properties required while keeping others optional
 */
type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>

/**
 * Creates a type with all properties as strings (for form handling)
 */
type StringifyFields<T> = {
	[K in keyof T]: string
}

// Usage
interface CreateUserRequest {
	name?: string
	email?: string
	password?: string
}

// Require name and email for user creation
type ValidatedUserRequest = RequireFields<CreateUserRequest, 'name' | 'email'>

// Form state type
type UserFormState = StringifyFields<CreateUserRequest>
```

## Type Guards

### Runtime Type Checking
- **Use type guards** for runtime validation
- **Narrow types** safely
- **Handle null/undefined** explicitly

```typescript
// ✅ Good - Type guards
function isString(value: unknown): value is string {
	return typeof value === 'string'
}

function isUser(obj: unknown): obj is User {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		'name' in obj &&
		'email' in obj
	)
}

// Usage
function processUserData(data: unknown) {
	if (isUser(data)) {
		// TypeScript knows data is User here
		console.log(data.name) // ✅ Safe
	} else {
		throw new Error('Invalid user data')
	}
}

// ✅ Good - Null checking
function getUserName(user: User | null): string {
	if (user === null) {
		return 'Anonymous'
	}
	return user.name // ✅ TypeScript knows user is not null
}
```

## Function Types

### Function Signatures
- **Explicit return types** for public functions
- **Parameter types** always specified
- **Use function overloads** when appropriate

```typescript
// ✅ Good - Explicit function types
function calculateTotal(
	price: number,
	taxRate: number,
	discount?: number
): number {
	const discountAmount = discount ?? 0
	return price * (1 + taxRate) - discountAmount
}

// ✅ Good - Function overloads
function formatDate(date: Date): string
function formatDate(date: string): string
function formatDate(date: number): string
function formatDate(date: Date | string | number): string {
	const dateObj = new Date(date)
	return dateObj.toISOString().split('T')[0]
}

// ✅ Good - Async function types
async function fetchUser(id: string): Promise<User | null> {
	try {
		const response = await api.get(`/users/${id}`)
		return response.data
	} catch (error) {
		console.error('Failed to fetch user:', error)
		return null
	}
}
```

### Callback Types
- **Define callback interfaces**
- **Use generic callbacks** when appropriate
- **Handle error callbacks** properly

```typescript
// ✅ Good - Callback type definitions
type EventHandler<T = void> = (data: T) => void
type AsyncEventHandler<T = void> = (data: T) => Promise<void>

interface ApiCallbacks<T> {
	onSuccess: EventHandler<T>
	onError: EventHandler<Error>
	onLoading?: EventHandler<boolean>
}

// Usage
function apiCall<T>(
	url: string,
	callbacks: ApiCallbacks<T>
): void {
	callbacks.onLoading?.(true)
	
	fetch(url)
		.then(response => response.json())
		.then(data => {
			callbacks.onLoading?.(false)
			callbacks.onSuccess(data)
		})
		.catch(error => {
			callbacks.onLoading?.(false)
			callbacks.onError(error)
		})
}
```

## Enums vs Union Types

### When to Use Each
- **Use union types** for simple string/number constants
- **Use enums** for complex mappings or when you need reverse lookup
- **Prefer const assertions** for readonly data

```typescript
// ✅ Good - Union types for simple constants
type UserRole = 'admin' | 'user' | 'guest'
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

// ✅ Good - Enums for complex mappings
enum HttpStatusCode {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	NOT_FOUND = 404,
	INTERNAL_SERVER_ERROR = 500,
}

// ✅ Good - Const assertions for readonly data
const THEMES = ['light', 'dark', 'auto'] as const
type Theme = typeof THEMES[number] // 'light' | 'dark' | 'auto'

const API_ENDPOINTS = {
	USERS: '/api/users',
	TRANSACTIONS: '/api/transactions',
	BUDGETS: '/api/budgets',
} as const
```

## Error Handling

### Error Types
- **Define custom error types**
- **Use discriminated unions** for error handling
- **Type-safe error handling**

```typescript
// ✅ Good - Custom error types
class ValidationError extends Error {
	constructor(
		message: string,
		public field: string,
		public code: string
	) {
		super(message)
		this.name = 'ValidationError'
	}
}

class ApiError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public endpoint: string
	) {
		super(message)
		this.name = 'ApiError'
	}
}

// ✅ Good - Result type for error handling
type Result<T, E = Error> = 
	| { success: true; data: T }
	| { success: false; error: E }

async function safeApiCall<T>(url: string): Promise<Result<T, ApiError>> {
	try {
		const response = await fetch(url)
		if (!response.ok) {
			return {
				success: false,
				error: new ApiError(
					'API call failed',
					response.status,
					url
				),
			}
		}
		const data = await response.json()
		return { success: true, data }
	} catch (error) {
		return {
			success: false,
			error: new ApiError('Network error', 0, url),
		}
	}
}
```

## Module Declarations

### Ambient Declarations
- **Declare external libraries** without types
- **Extend existing types** when needed
- **Use module augmentation** carefully

```typescript
// ✅ Good - Ambient declarations
declare module '*.svg' {
	const content: string
	export default content
}

declare module '*.png' {
	const content: string
	export default content
}

// ✅ Good - Module augmentation
declare module 'react' {
	interface CSSProperties {
		'--custom-property'?: string
	}
}

// ✅ Good - Global type extensions
declare global {
	interface Window {
		gtag?: (...args: any[]) => void
	}
}
```

## Best Practices Summary

1. **Always use strict mode**
2. **Prefer interfaces over types** for objects
3. **Use utility types** to transform existing types
4. **Implement type guards** for runtime safety
5. **Define custom error types** for better error handling
6. **Use generics** for reusable type-safe code
7. **Document complex types** with JSDoc comments
8. **Avoid `any` type** - use `unknown` instead
9. **Use const assertions** for readonly data
10. **Leverage discriminated unions** for state management