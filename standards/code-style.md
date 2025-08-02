# Code Style Standards

## General Formatting

### Indentation
- **Use tabs** for indentation (not spaces)
- Consistent across all file types
- Tab width: 2 spaces equivalent

### Quotes
- **Single quotes** for strings (except to avoid escaping)
- Double quotes only when necessary to avoid escaping

```typescript
// ✅ Good
const message = 'Hello world'
const withApostrophe = "Don't worry"

// ❌ Bad
const message = "Hello world"
const withApostrophe = 'Don\'t worry'
```

### Semicolons
- **Omit semicolons** (unless required for disambiguation)
- Let ASI (Automatic Semicolon Insertion) handle it

```typescript
// ✅ Good
const name = 'John'
const age = 25

// ❌ Bad
const name = 'John';
const age = 25;
```

### Line Length
- **Maximum 80 characters** per line
- Break long lines appropriately
- Use prettier or manual formatting

### Spacing
- **Space after keywords**: `if (`, `for (`, `while (`
- **Space before function parentheses**: `function name ()`
- **Space around operators**: `a + b`, `x === y`
- **Space after commas**: `[a, b, c]`, `{x, y, z}`
- **No trailing spaces**

```typescript
// ✅ Good
if (condition) {
	return true
}

function handleClick (event) {
	console.log('clicked')
}

const result = a + b
const array = [1, 2, 3]

// ❌ Bad
if(condition){
	return true
}

function handleClick(event){
	console.log('clicked')
}

const result=a+b
const array=[1,2,3]
```

### Braces
- **Same line** for opening braces
- **New line** for closing braces
- **Always use braces** for multi-line statements
- **Keep else on same line** as closing brace

```typescript
// ✅ Good
if (condition) {
	doSomething()
} else {
	doSomethingElse()
}

// ❌ Bad
if (condition)
{
	doSomething()
}
else
{
	doSomethingElse()
}
```

### Trailing Commas
- **Use trailing commas** in multiline objects/arrays
- Helps with version control diffs

```typescript
// ✅ Good
const config = {
	api: 'https://api.example.com',
	timeout: 5000,
	retries: 3,
}

const items = [
	'first',
	'second',
	'third',
]

// ❌ Bad
const config = {
	api: 'https://api.example.com',
	timeout: 5000,
	retries: 3
}
```

## Variable Declaration
- **Use const** by default
- **Use let** when reassignment needed
- **Avoid var** completely

```typescript
// ✅ Good
const name = 'John'
let counter = 0

// ❌ Bad
var name = 'John'
var counter = 0
```

## Equality
- **Always use strict equality** (`===`, `!==`)
- **Never use loose equality** (`==`, `!=`)

```typescript
// ✅ Good
if (value === null) {
	return
}

if (count !== 0) {
	process()
}

// ❌ Bad
if (value == null) {
	return
}

if (count != 0) {
	process()
}
```

## Comments
- **Use JSDoc** for function documentation
- **Single line comments** with `//`
- **Block comments** with `/* */` for longer explanations
- **Space after comment markers**

```typescript
// ✅ Good
// This is a single line comment

/*
 * This is a multi-line comment
 * with proper formatting
 */

/**
 * Calculates the total price including tax
 * @param price - The base price
 * @param taxRate - The tax rate (0.1 for 10%)
 * @returns The total price with tax
 */
function calculateTotal (price: number, taxRate: number): number {
	return price * (1 + taxRate)
}
```

## File Organization
- **Imports at top**
- **Exports at bottom** (or inline)
- **Group related code**
- **Separate concerns**

```typescript
// ✅ Good file structure
// External imports
import React from 'react'
import { useState } from 'react'

// Internal imports
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

// Types
interface Props {
	title: string
}

// Component
function MyComponent ({ title }: Props) {
	// Component logic
}

// Export
export default MyComponent
```

## Error Handling
- **Always handle errors** in callbacks
- **Use try-catch** for async operations
- **Provide meaningful error messages**

```typescript
// ✅ Good
try {
	const data = await fetchData()
	return data
} catch (error) {
	console.error('Failed to fetch data:', error)
	throw new Error('Data fetch failed')
}
```

## Unused Variables
- **Remove unused variables**
- **Use underscore prefix** for intentionally unused parameters

```typescript
// ✅ Good
function handleClick (_event: MouseEvent) {
	// Event parameter not used but required by interface
	console.log('Button clicked')
}

// ❌ Bad
function handleClick (event: MouseEvent) {
	// Event parameter not used
	console.log('Button clicked')
}
```