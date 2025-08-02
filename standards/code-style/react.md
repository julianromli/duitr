# React Style Guide

## Component Structure

### File Organization
- **Use `.tsx` extension** for components with JSX
- **PascalCase** for component file names
- **One component per file** (main export)
- **Co-locate related files** (styles, tests, types)

```
// ✅ Good file structure
components/
├── user-profile/
│   ├── UserProfile.tsx
│   ├── UserProfile.test.tsx
│   ├── UserProfile.types.ts
│   └── index.ts
└── button/
    ├── Button.tsx
    ├── Button.test.tsx
    └── index.ts
```

### Component Definition
- **Use function declarations** (not arrow functions)
- **TypeScript interfaces** for props
- **Explicit return types** for complex components
- **Props destructuring** in parameters

```typescript
// ✅ Good - Function declaration with interface
interface UserCardProps {
	user: User
	onEdit?: (user: User) => void
	onDelete?: (userId: string) => void
	showActions?: boolean
}

function UserCard ({ user, onEdit, onDelete, showActions = true }: UserCardProps) {
	const handleEdit = () => {
		onEdit?.(user)
	}

	const handleDelete = () => {
		onDelete?.(user.id)
	}

	return (
		<div className="user-card">
			<h3>{user.name}</h3>
			<p>{user.email}</p>
			{showActions && (
				<div className="actions">
					<button onClick={handleEdit}>Edit</button>
					<button onClick={handleDelete}>Delete</button>
				</div>
			)}
		</div>
	)
}

export default UserCard

// ❌ Bad - Arrow function export
export const UserCard = ({ user }: { user: User }) => {
	return <div>{user.name}</div>
}
```

## Props and Interfaces

### Props Design
- **Optional props** with default values
- **Event handlers** prefixed with `on`
- **Boolean props** prefixed with verbs
- **Avoid object props** when possible (prefer primitive props)

```typescript
// ✅ Good - Well-designed props
interface ButtonProps {
	// Content
	children: React.ReactNode
	
	// Appearance
	variant?: 'primary' | 'secondary' | 'danger'
	size?: 'sm' | 'md' | 'lg'
	
	// State
	isLoading?: boolean
	isDisabled?: boolean
	
	// Events
	onClick?: () => void
	onFocus?: () => void
	
	// HTML attributes
	type?: 'button' | 'submit' | 'reset'
	'aria-label'?: string
}

function Button ({
	children,
	variant = 'primary',
	size = 'md',
	isLoading = false,
	isDisabled = false,
	onClick,
	onFocus,
	type = 'button',
	...ariaProps
}: ButtonProps) {
	return (
		<button
			type={type}
			className={`btn btn-${variant} btn-${size}`}
			disabled={isDisabled || isLoading}
			onClick={onClick}
			onFocus={onFocus}
			{...ariaProps}
		>
			{isLoading ? 'Loading...' : children}
		</button>
	)
}

// ❌ Bad - Poor props design
interface BadButtonProps {
	config: {
		variant: string
		size: string
		loading: boolean
	}
	handlers: {
		click: () => void
		focus: () => void
	}
}
```

### Children Patterns
- **Use React.ReactNode** for children type
- **Render props** for flexible components
- **Compound components** for related UI elements

```typescript
// ✅ Good - Flexible children patterns
interface CardProps {
	children: React.ReactNode
	header?: React.ReactNode
	footer?: React.ReactNode
}

function Card ({ children, header, footer }: CardProps) {
	return (
		<div className="card">
			{header && <div className="card-header">{header}</div>}
			<div className="card-body">{children}</div>
			{footer && <div className="card-footer">{footer}</div>}
		</div>
	)
}

// ✅ Good - Render props pattern
interface DataFetcherProps<T> {
	url: string
	children: (data: T | null, loading: boolean, error: Error | null) => React.ReactNode
}

function DataFetcher<T> ({ url, children }: DataFetcherProps<T>) {
	const [data, setData] = useState<T | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	useEffect(() => {
		fetchData(url)
			.then(setData)
			.catch(setError)
			.finally(() => setLoading(false))
	}, [url])

	return <>{children(data, loading, error)}</>
}

// Usage
<DataFetcher<User[]> url="/api/users">
	{(users, loading, error) => {
		if (loading) return <Spinner />
		if (error) return <ErrorMessage error={error} />
		return <UserList users={users || []} />
	}}
</DataFetcher>
```

## Hooks Usage

### State Management
- **useState** for simple state
- **useReducer** for complex state logic
- **Custom hooks** for reusable logic
- **Proper dependency arrays** in useEffect

```typescript
// ✅ Good - useState for simple state
function Counter () {
	const [count, setCount] = useState(0)

	const increment = () => setCount(prev => prev + 1)
	const decrement = () => setCount(prev => prev - 1)

	return (
		<div>
			<span>{count}</span>
			<button onClick={increment}>+</button>
			<button onClick={decrement}>-</button>
		</div>
	)
}

// ✅ Good - useReducer for complex state
interface TodoState {
	todos: Todo[]
	filter: 'all' | 'active' | 'completed'
}

type TodoAction =
	| { type: 'ADD_TODO'; payload: string }
	| { type: 'TOGGLE_TODO'; payload: string }
	| { type: 'SET_FILTER'; payload: TodoState['filter'] }

function todoReducer (state: TodoState, action: TodoAction): TodoState {
	switch (action.type) {
		case 'ADD_TODO':
			return {
				...state,
				todos: [...state.todos, { id: Date.now().toString(), text: action.payload, completed: false }],
			}
		case 'TOGGLE_TODO':
			return {
				...state,
				todos: state.todos.map(todo =>
					todo.id === action.payload ? { ...todo, completed: !todo.completed } : todo
				),
			}
		case 'SET_FILTER':
			return { ...state, filter: action.payload }
		default:
			return state
	}
}

function TodoApp () {
	const [state, dispatch] = useReducer(todoReducer, {
		todos: [],
		filter: 'all',
	})

	// Component logic...
}
```

### Custom Hooks
- **Extract reusable logic**
- **Return objects** for multiple values
- **Use TypeScript** for hook parameters and returns
- **Follow naming convention** (`use` prefix)

```typescript
// ✅ Good - Custom hook with TypeScript
interface UseApiOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
	headers?: Record<string, string>
	body?: any
}

interface UseApiReturn<T> {
	data: T | null
	loading: boolean
	error: Error | null
	refetch: () => void
}

function useApi<T> (url: string, options: UseApiOptions = {}): UseApiReturn<T> {
	const [data, setData] = useState<T | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<Error | null>(null)

	const fetchData = useCallback(async () => {
		setLoading(true)
		setError(null)
		
		try {
			const response = await fetch(url, {
				method: options.method || 'GET',
				headers: options.headers,
				body: options.body ? JSON.stringify(options.body) : undefined,
			})
			
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}
			
			const result = await response.json()
			setData(result)
		} catch (err) {
			setError(err instanceof Error ? err : new Error('Unknown error'))
		} finally {
			setLoading(false)
		}
	}, [url, options.method, options.headers, options.body])

	useEffect(() => {
		fetchData()
	}, [fetchData])

	return {
		data,
		loading,
		error,
		refetch: fetchData,
	}
}

// Usage
function UserProfile ({ userId }: { userId: string }) {
	const { data: user, loading, error, refetch } = useApi<User>(`/api/users/${userId}`)

	if (loading) return <Spinner />
	if (error) return <ErrorMessage error={error} onRetry={refetch} />
	if (!user) return <div>User not found</div>

	return <UserCard user={user} />
}
```

### Effect Dependencies
- **Include all dependencies** in dependency array
- **Use useCallback** for function dependencies
- **Use useMemo** for object dependencies
- **Cleanup effects** when necessary

```typescript
// ✅ Good - Proper effect dependencies
function UserSearch ({ initialQuery = '' }: { initialQuery?: string }) {
	const [query, setQuery] = useState(initialQuery)
	const [results, setResults] = useState<User[]>([])
	const [loading, setLoading] = useState(false)

	// Memoize search function to avoid unnecessary effect runs
	const searchUsers = useCallback(async (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setResults([])
			return
		}

		setLoading(true)
		try {
			const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`)
			const users = await response.json()
			setResults(users)
		} catch (error) {
			console.error('Search failed:', error)
			setResults([])
		} finally {
			setLoading(false)
		}
	}, [])

	// Debounced search effect
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			searchUsers(query)
		}, 300)

		// Cleanup timeout on query change or unmount
		return () => clearTimeout(timeoutId)
	}, [query, searchUsers])

	return (
		<div>
			<input
				value={query}
				onChange={(e) => setQuery(e.target.value)}
				placeholder="Search users..."
			/>
			{loading && <Spinner />}
			<UserList users={results} />
		</div>
	)
}
```

## Performance Optimization

### Memoization
- **React.memo** for expensive components
- **useMemo** for expensive calculations
- **useCallback** for stable function references
- **Avoid premature optimization**

```typescript
// ✅ Good - Memoized expensive component
interface ExpensiveListProps {
	items: Item[]
	onItemClick: (item: Item) => void
	filter: string
}

const ExpensiveList = React.memo(function ExpensiveList ({
	items,
	onItemClick,
	filter,
}: ExpensiveListProps) {
	// Expensive filtering calculation
	const filteredItems = useMemo(() => {
		return items.filter(item => 
			item.name.toLowerCase().includes(filter.toLowerCase())
		)
	}, [items, filter])

	// Stable click handler
	const handleItemClick = useCallback((item: Item) => {
		onItemClick(item)
	}, [onItemClick])

	return (
		<ul>
			{filteredItems.map(item => (
				<ExpensiveListItem
					key={item.id}
					item={item}
					onClick={handleItemClick}
				/>
			))}
		</ul>
	)
})

// Custom comparison for memo
const ExpensiveListWithCustomComparison = React.memo(
	ExpensiveList,
	(prevProps, nextProps) => {
		return (
			prevProps.items.length === nextProps.items.length &&
			prevProps.filter === nextProps.filter &&
			prevProps.onItemClick === nextProps.onItemClick
		)
	}
)
```

### List Rendering
- **Stable keys** (never use array index)
- **Virtualization** for large lists
- **Pagination** or infinite scroll
- **Memoized list items**

```typescript
// ✅ Good - Proper list rendering
interface TodoListProps {
	todos: Todo[]
	onToggle: (id: string) => void
	onDelete: (id: string) => void
}

function TodoList ({ todos, onToggle, onDelete }: TodoListProps) {
	// Memoize handlers to prevent unnecessary re-renders
	const handleToggle = useCallback((id: string) => {
		onToggle(id)
	}, [onToggle])

	const handleDelete = useCallback((id: string) => {
		onDelete(id)
	}, [onDelete])

	return (
		<ul className="todo-list">
			{todos.map(todo => (
				<TodoItem
					key={todo.id} // ✅ Stable, unique key
					todo={todo}
					onToggle={handleToggle}
					onDelete={handleDelete}
				/>
			))}
		</ul>
	)
}

// ✅ Good - Memoized list item
interface TodoItemProps {
	todo: Todo
	onToggle: (id: string) => void
	onDelete: (id: string) => void
}

const TodoItem = React.memo(function TodoItem ({
	todo,
	onToggle,
	onDelete,
}: TodoItemProps) {
	const handleToggle = () => onToggle(todo.id)
	const handleDelete = () => onDelete(todo.id)

	return (
		<li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
			<input
				type="checkbox"
				checked={todo.completed}
				onChange={handleToggle}
			/>
			<span>{todo.text}</span>
			<button onClick={handleDelete}>Delete</button>
		</li>
	)
})
```

## Event Handling

### Event Handlers
- **Descriptive handler names**
- **Type event parameters**
- **Prevent default** when necessary
- **Handle async events** properly

```typescript
// ✅ Good - Proper event handling
interface LoginFormProps {
	onSubmit: (credentials: LoginCredentials) => Promise<void>
}

function LoginForm ({ onSubmit }: LoginFormProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(event.target.value)
	}

	const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPassword(event.target.value)
	}

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		
		if (isSubmitting) return
		
		setIsSubmitting(true)
		try {
			await onSubmit({ email, password })
		} catch (error) {
			console.error('Login failed:', error)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === 'Enter' && event.ctrlKey) {
			// Ctrl+Enter to submit
			const form = event.currentTarget.closest('form')
			form?.requestSubmit()
		}
	}

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="email"
				value={email}
				onChange={handleEmailChange}
				onKeyDown={handleKeyDown}
				required
			/>
			<input
				type="password"
				value={password}
				onChange={handlePasswordChange}
				onKeyDown={handleKeyDown}
				required
			/>
			<button type="submit" disabled={isSubmitting}>
				{isSubmitting ? 'Logging in...' : 'Login'}
			</button>
		</form>
	)
}
```

## JSX Best Practices

### JSX Formatting
- **Self-closing tags** for elements without children
- **Multiline JSX** in parentheses
- **Consistent indentation**
- **Logical grouping** of props

```typescript
// ✅ Good - JSX formatting
function UserProfile ({ user, isEditing, onEdit, onSave, onCancel }: UserProfileProps) {
	return (
		<div className="user-profile">
			<div className="user-avatar">
				<img
					src={user.avatar}
					alt={`${user.name}'s avatar`}
					width={64}
					height={64}
				/>
			</div>
			
			<div className="user-info">
				{isEditing ? (
					<EditableUserInfo
						user={user}
						onSave={onSave}
						onCancel={onCancel}
					/>
				) : (
					<ReadOnlyUserInfo
						user={user}
						onEdit={onEdit}
					/>
				)}
			</div>
		</div>
	)
}
```

### Conditional Rendering
- **Use logical AND** for simple conditions
- **Use ternary** for if-else conditions
- **Extract complex conditions** to variables
- **Handle null/undefined** explicitly

```typescript
// ✅ Good - Conditional rendering patterns
function Dashboard ({ user, notifications, isLoading }: DashboardProps) {
	const hasNotifications = notifications && notifications.length > 0
	const showWelcomeMessage = user && !user.hasSeenWelcome
	
	if (isLoading) {
		return <LoadingSpinner />
	}
	
	if (!user) {
		return <LoginPrompt />
	}

	return (
		<div className="dashboard">
			{showWelcomeMessage && (
				<WelcomeMessage user={user} />
			)}
			
			<div className="dashboard-header">
				<h1>Welcome back, {user.name}!</h1>
				{hasNotifications ? (
					<NotificationBadge count={notifications.length} />
				) : (
					<span>No new notifications</span>
				)}
			</div>
			
			<DashboardContent user={user} />
		</div>
	)
}
```

## Error Boundaries

### Error Boundary Implementation
- **Wrap risky components**
- **Provide fallback UI**
- **Log errors** for debugging
- **Reset error state** when appropriate

```typescript
// ✅ Good - Error boundary with TypeScript
interface ErrorBoundaryState {
	hasError: boolean
	error?: Error
}

interface ErrorBoundaryProps {
	children: React.ReactNode
	fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
	onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
	constructor (props: ErrorBoundaryProps) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError (error: Error): ErrorBoundaryState {
		return { hasError: true, error }
	}

	componentDidCatch (error: Error, errorInfo: React.ErrorInfo) {
		console.error('Error caught by boundary:', error, errorInfo)
		this.props.onError?.(error, errorInfo)
	}

	resetError = () => {
		this.setState({ hasError: false, error: undefined })
	}

	render () {
		if (this.state.hasError && this.state.error) {
			const FallbackComponent = this.props.fallback || DefaultErrorFallback
			return (
				<FallbackComponent
					error={this.state.error}
					resetError={this.resetError}
				/>
			)
		}

		return this.props.children
	}
}

// Default fallback component
function DefaultErrorFallback ({ error, resetError }: { error: Error; resetError: () => void }) {
	return (
		<div className="error-boundary">
			<h2>Something went wrong</h2>
			<details>
				<summary>Error details</summary>
				<pre>{error.message}</pre>
			</details>
			<button onClick={resetError}>Try again</button>
		</div>
	)
}

// Usage
function App () {
	return (
		<ErrorBoundary
			fallback={CustomErrorFallback}
			onError={(error, errorInfo) => {
				// Log to error reporting service
				console.error('App error:', error, errorInfo)
			}}
		>
			<Router>
				<Routes>
					<Route path="/" element={<Dashboard />} />
					<Route path="/profile" element={<Profile />} />
				</Routes>
			</Router>
		</ErrorBoundary>
	)
}
```

## Best Practices Summary

1. **Use function declarations** for components
2. **TypeScript interfaces** for all props
3. **Destructure props** in parameters
4. **Extract reusable logic** into custom hooks
5. **Memoize expensive operations** with useMemo/useCallback
6. **Use React.memo** for expensive components
7. **Proper dependency arrays** in useEffect
8. **Stable keys** for list items
9. **Handle errors** with error boundaries
10. **Clean up effects** when necessary
11. **Avoid inline functions** in JSX
12. **Use semantic HTML** and proper accessibility
13. **Keep components small** and focused
14. **Test components** thoroughly
15. **Document complex components** with JSDoc