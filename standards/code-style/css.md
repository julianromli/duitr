# CSS & Tailwind CSS Style Guide

## Tailwind CSS Philosophy

### Utility-First Approach
- **Use utility classes** instead of custom CSS
- **Compose complex components** from simple utilities
- **Avoid custom CSS** unless absolutely necessary
- **Mobile-first responsive design**

```tsx
// ✅ Good - Utility-first approach
function Card ({ children, variant = 'default' }: CardProps) {
	const baseClasses = 'rounded-lg border bg-card text-card-foreground shadow-sm'
	const variantClasses = {
		default: 'border-border',
		destructive: 'border-destructive/50 text-destructive dark:border-destructive',
		outline: 'border-border',
	}

	return (
		<div className={`${baseClasses} ${variantClasses[variant]}`}>
			{children}
		</div>
	)
}

// ❌ Bad - Custom CSS for simple styling
// card.css
.custom-card {
	border-radius: 0.5rem;
	border: 1px solid var(--border);
	background-color: var(--card);
	color: var(--card-foreground);
	box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}
```

### Class Organization
- **Group related utilities** together
- **Responsive classes** at the end
- **State modifiers** (hover, focus) last
- **Use consistent ordering**

```tsx
// ✅ Good - Organized class structure
function Button ({ children, variant, size, disabled }: ButtonProps) {
	return (
		<button
			className={
				// Layout & positioning
				'inline-flex items-center justify-center ' +
				// Spacing
				'px-4 py-2 ' +
				// Typography
				'text-sm font-medium ' +
				// Appearance
				'rounded-md border border-transparent ' +
				'bg-primary text-primary-foreground ' +
				// Transitions
				'transition-colors ' +
				// States
				'hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-ring ' +
				'disabled:pointer-events-none disabled:opacity-50 ' +
				// Responsive
				'md:px-6 md:py-3'
			}
			disabled={disabled}
		>
			{children}
		</button>
	)
}
```

## Responsive Design

### Mobile-First Approach
- **Start with mobile styles**
- **Add larger breakpoints** progressively
- **Use Tailwind breakpoints** consistently
- **Test on multiple screen sizes**

```tsx
// ✅ Good - Mobile-first responsive design
function ResponsiveGrid ({ children }: { children: React.ReactNode }) {
	return (
		<div className={
			// Mobile: single column
			'grid grid-cols-1 gap-4 ' +
			// Tablet: 2 columns
			'md:grid-cols-2 md:gap-6 ' +
			// Desktop: 3 columns
			'lg:grid-cols-3 lg:gap-8 ' +
			// Large desktop: 4 columns
			'xl:grid-cols-4'
		}>
			{children}
		</div>
	)
}

// ✅ Good - Responsive typography
function Hero ({ title, subtitle }: HeroProps) {
	return (
		<div className="text-center">
			<h1 className={
				// Mobile: smaller text
				'text-3xl font-bold tracking-tight ' +
				// Tablet: medium text
				'md:text-4xl ' +
				// Desktop: large text
				'lg:text-5xl xl:text-6xl'
			}>
				{title}
			</h1>
			<p className={
				'mt-4 text-lg text-muted-foreground ' +
				'md:text-xl ' +
				'lg:text-2xl'
			}>
				{subtitle}
			</p>
		</div>
	)
}
```

### Breakpoint Strategy
- **sm: 640px** - Small tablets
- **md: 768px** - Tablets
- **lg: 1024px** - Small laptops
- **xl: 1280px** - Desktops
- **2xl: 1536px** - Large desktops

```tsx
// ✅ Good - Consistent breakpoint usage
function Navigation () {
	return (
		<nav className={
			// Mobile: hidden menu, show hamburger
			'flex items-center justify-between p-4 ' +
			// Desktop: show full menu
			'lg:px-8'
		}>
			<Logo />
			
			{/* Mobile menu button */}
			<button className="lg:hidden">
				<MenuIcon />
			</button>
			
			{/* Desktop menu */}
			<div className="hidden lg:flex lg:items-center lg:space-x-8">
				<NavLink href="/dashboard">Dashboard</NavLink>
				<NavLink href="/transactions">Transactions</NavLink>
				<NavLink href="/budgets">Budgets</NavLink>
			</div>
		</nav>
	)
}
```

## Dark Mode Implementation

### CSS Variables Approach
- **Use CSS custom properties**
- **Define light and dark themes**
- **Use semantic color names**
- **Consistent color usage**

```css
/* ✅ Good - CSS variables for theming */
:root {
	/* Light theme */
	--background: 0 0% 100%;
	--foreground: 222.2 84% 4.9%;
	--card: 0 0% 100%;
	--card-foreground: 222.2 84% 4.9%;
	--primary: 222.2 47.4% 11.2%;
	--primary-foreground: 210 40% 98%;
	--muted: 210 40% 96%;
	--muted-foreground: 215.4 16.3% 46.9%;
	--border: 214.3 31.8% 91.4%;
}

.dark {
	/* Dark theme */
	--background: 222.2 84% 4.9%;
	--foreground: 210 40% 98%;
	--card: 222.2 84% 4.9%;
	--card-foreground: 210 40% 98%;
	--primary: 210 40% 98%;
	--primary-foreground: 222.2 47.4% 11.2%;
	--muted: 217.2 32.6% 17.5%;
	--muted-foreground: 215 20.2% 65.1%;
	--border: 217.2 32.6% 17.5%;
}
```

```tsx
// ✅ Good - Using theme-aware classes
function ThemeAwareCard ({ children }: { children: React.ReactNode }) {
	return (
		<div className={
			// Background adapts to theme
			'bg-card text-card-foreground ' +
			// Border adapts to theme
			'border border-border ' +
			// Shadow adapts to theme
			'shadow-sm ' +
			'rounded-lg p-6'
		}>
			{children}
		</div>
	)
}

// ✅ Good - Dark mode specific styles
function StatusIndicator ({ status }: { status: 'success' | 'error' | 'warning' }) {
	const statusClasses = {
		success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
		error: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
		warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
	}

	return (
		<span className={`px-2 py-1 rounded-full text-sm font-medium ${statusClasses[status]}`}>
			{status}
		</span>
	)
}
```

## Component Styling Patterns

### Variant-Based Styling
- **Define clear variants**
- **Use consistent naming**
- **Compose from base styles**
- **Support size variations**

```tsx
// ✅ Good - Variant-based button component
interface ButtonProps {
	variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
	size?: 'default' | 'sm' | 'lg' | 'icon'
	children: React.ReactNode
	onClick?: () => void
	disabled?: boolean
}

function Button ({ variant = 'default', size = 'default', children, ...props }: ButtonProps) {
	const baseClasses = (
		'inline-flex items-center justify-center rounded-md text-sm font-medium ' +
		'transition-colors focus-visible:outline-none focus-visible:ring-2 ' +
		'focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50'
	)

	const variantClasses = {
		default: 'bg-primary text-primary-foreground hover:bg-primary/90',
		destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
		outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
		secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
		ghost: 'hover:bg-accent hover:text-accent-foreground',
		link: 'text-primary underline-offset-4 hover:underline',
	}

	const sizeClasses = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 rounded-md px-3',
		lg: 'h-11 rounded-md px-8',
		icon: 'h-10 w-10',
	}

	return (
		<button
			className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
			{...props}
		>
			{children}
		</button>
	)
}
```

### Layout Components
- **Flexible container components**
- **Consistent spacing system**
- **Reusable layout patterns**
- **Responsive by default**

```tsx
// ✅ Good - Flexible layout components
interface ContainerProps {
	children: React.ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
	padding?: boolean
}

function Container ({ children, size = 'lg', padding = true }: ContainerProps) {
	const sizeClasses = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl',
		full: 'max-w-full',
	}

	const paddingClasses = padding ? 'px-4 md:px-6 lg:px-8' : ''

	return (
		<div className={`mx-auto ${sizeClasses[size]} ${paddingClasses}`}>
			{children}
		</div>
	)
}

// ✅ Good - Stack component for vertical spacing
interface StackProps {
	children: React.ReactNode
	spacing?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	align?: 'start' | 'center' | 'end' | 'stretch'
}

function Stack ({ children, spacing = 'md', align = 'stretch' }: StackProps) {
	const spacingClasses = {
		xs: 'space-y-1',
		sm: 'space-y-2',
		md: 'space-y-4',
		lg: 'space-y-6',
		xl: 'space-y-8',
	}

	const alignClasses = {
		start: 'items-start',
		center: 'items-center',
		end: 'items-end',
		stretch: 'items-stretch',
	}

	return (
		<div className={`flex flex-col ${spacingClasses[spacing]} ${alignClasses[align]}`}>
			{children}
		</div>
	)
}
```

## Accessibility in CSS

### Focus Management
- **Visible focus indicators**
- **Logical tab order**
- **Skip links** for navigation
- **Focus trapping** in modals

```tsx
// ✅ Good - Accessible focus styles
function AccessibleButton ({ children, ...props }: ButtonProps) {
	return (
		<button
			className={
				// Base styles
				'px-4 py-2 rounded-md font-medium ' +
				// Focus styles for accessibility
				'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ' +
				// Dark mode focus
				'dark:focus:ring-offset-gray-800 ' +
				// Hover and active states
				'hover:bg-blue-600 active:bg-blue-700 ' +
				// Disabled state
				'disabled:opacity-50 disabled:cursor-not-allowed'
			}
			{...props}
		>
			{children}
		</button>
	)
}

// ✅ Good - Skip link for keyboard navigation
function SkipLink () {
	return (
		<a
			href="#main-content"
			className={
				// Hidden by default
				'sr-only ' +
				// Visible when focused
				'focus:not-sr-only focus:absolute focus:top-4 focus:left-4 ' +
				'focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white ' +
				'focus:rounded-md focus:shadow-lg'
			}
		>
			Skip to main content
		</a>
	)
}
```

### Color Contrast
- **WCAG AA compliance** (4.5:1 ratio)
- **Test with color blindness** simulators
- **Don't rely on color alone** for information
- **Use semantic colors**

```tsx
// ✅ Good - High contrast, semantic colors
function StatusMessage ({ type, children }: { type: 'success' | 'error' | 'warning'; children: React.ReactNode }) {
	const typeClasses = {
		success: (
			// High contrast green
			'bg-green-50 border-green-200 text-green-800 ' +
			'dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
		),
		error: (
			// High contrast red
			'bg-red-50 border-red-200 text-red-800 ' +
			'dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
		),
		warning: (
			// High contrast yellow/orange
			'bg-yellow-50 border-yellow-200 text-yellow-800 ' +
			'dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200'
		),
	}

	const icons = {
		success: '✓',
		error: '✕',
		warning: '⚠',
	}

	return (
		<div className={`p-4 border rounded-md flex items-start space-x-3 ${typeClasses[type]}`}>
			<span className="font-bold" aria-hidden="true">
				{icons[type]}
			</span>
			<div>{children}</div>
		</div>
	)
}
```

## Animation and Transitions

### Subtle Animations
- **Use transitions** for state changes
- **Respect motion preferences**
- **Keep animations fast** (< 300ms)
- **Use easing functions**

```tsx
// ✅ Good - Respectful animations
function AnimatedCard ({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
	return (
		<div
			className={
				// Base styles
				'bg-card border border-border rounded-lg p-6 ' +
				// Smooth transitions
				'transition-all duration-200 ease-in-out ' +
				// Respect motion preferences
				'motion-reduce:transition-none ' +
				// Conditional visibility
				(isVisible
					? 'opacity-100 translate-y-0'
					: 'opacity-0 translate-y-2 pointer-events-none'
				)
			}
		>
			{children}
		</div>
	)
}

// ✅ Good - Hover animations
function InteractiveButton ({ children, ...props }: ButtonProps) {
	return (
		<button
			className={
				'px-4 py-2 bg-blue-600 text-white rounded-md ' +
				// Smooth transitions
				'transition-all duration-150 ease-in-out ' +
				// Hover effects
				'hover:bg-blue-700 hover:scale-105 hover:shadow-md ' +
				// Active state
				'active:scale-95 ' +
				// Respect motion preferences
				'motion-reduce:transition-none motion-reduce:hover:scale-100'
			}
			{...props}
		>
			{children}
		</button>
	)
}
```

## Performance Considerations

### CSS Optimization
- **Purge unused styles** in production
- **Use JIT mode** for Tailwind
- **Minimize custom CSS**
- **Optimize critical CSS**

```javascript
// ✅ Good - Tailwind config for optimization
// tailwind.config.js
module.exports = {
	content: [
		'./src/**/*.{js,ts,jsx,tsx}',
		'./public/index.html',
	],
	theme: {
		extend: {
			// Custom theme extensions
		},
	},
	plugins: [],
	// Enable JIT mode for better performance
	mode: 'jit',
	// Purge unused styles in production
	purge: {
		enabled: process.env.NODE_ENV === 'production',
		content: ['./src/**/*.{js,ts,jsx,tsx}'],
	},
}
```

### Class Name Management
- **Use clsx** for conditional classes
- **Extract complex class logic**
- **Avoid string concatenation**
- **Use consistent patterns**

```tsx
// ✅ Good - Using clsx for class management
import clsx from 'clsx'

interface CardProps {
	children: React.ReactNode
	variant?: 'default' | 'outlined' | 'elevated'
	isActive?: boolean
	isDisabled?: boolean
	className?: string
}

function Card ({ children, variant = 'default', isActive, isDisabled, className }: CardProps) {
	return (
		<div
			className={clsx(
				// Base styles
				'rounded-lg p-6 transition-colors',
				// Variant styles
				{
					'bg-card border border-border': variant === 'default',
					'bg-transparent border-2 border-border': variant === 'outlined',
					'bg-card shadow-lg border-0': variant === 'elevated',
				},
				// State styles
				{
					'ring-2 ring-primary': isActive,
					'opacity-50 pointer-events-none': isDisabled,
				},
				// Custom className
				className
			)}
		>
			{children}
		</div>
	)
}

// ✅ Good - Extracted class logic
function getButtonClasses (variant: string, size: string, disabled: boolean) {
	return clsx(
		// Base classes
		'inline-flex items-center justify-center rounded-md font-medium',
		'transition-colors focus-visible:outline-none focus-visible:ring-2',
		// Size classes
		{
			'h-10 px-4 py-2 text-sm': size === 'default',
			'h-9 px-3 text-sm': size === 'sm',
			'h-11 px-8 text-base': size === 'lg',
		},
		// Variant classes
		{
			'bg-primary text-primary-foreground hover:bg-primary/90': variant === 'default',
			'bg-destructive text-destructive-foreground hover:bg-destructive/90': variant === 'destructive',
			'border border-input bg-background hover:bg-accent': variant === 'outline',
		},
		// Disabled state
		{
			'pointer-events-none opacity-50': disabled,
		}
	)
}
```

## Best Practices Summary

1. **Use utility-first approach** with Tailwind CSS
2. **Mobile-first responsive design**
3. **Implement proper dark mode** with CSS variables
4. **Create variant-based components**
5. **Ensure accessibility** with focus styles and contrast
6. **Use semantic color names**
7. **Respect motion preferences**
8. **Optimize for performance** with purging and JIT
9. **Use clsx** for conditional class names
10. **Keep animations subtle** and fast
11. **Test across devices** and screen sizes
12. **Maintain consistent spacing** system
13. **Document component variants**
14. **Use CSS custom properties** for theming
15. **Avoid custom CSS** when utilities suffice