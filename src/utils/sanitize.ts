/**
 * HTML Sanitization Utility
 * 
 * Provides secure HTML sanitization using DOMPurify to prevent XSS attacks.
 * This utility is critical for rendering user-generated or AI-generated content
 * that may contain untrusted HTML.
 * 
 * @security XSS Prevention
 * - Whitelist-based approach (only allowed tags/attributes pass through)
 * - Protocol restrictions (https, http, mailto only)
 * - No data: URIs allowed
 * - No event handlers allowed (onclick, onerror, etc.)
 * - DOM sanitization enabled to prevent DOM clobbering
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes HTML content using a strict whitelist configuration.
 * 
 * Safe for rendering user input, AI-generated content, or any untrusted HTML.
 * Allows basic formatting tags while blocking all potentially dangerous elements.
 * 
 * @param dirtyHTML - The untrusted HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering via dangerouslySetInnerHTML
 * 
 * @example
 * ```typescript
 * // Safe usage
 * const userInput = '<strong>Bold</strong><script>alert("XSS")</script>';
 * const clean = sanitizeHTML(userInput);
 * // Result: '<strong>Bold</strong>' (script tag removed)
 * 
 * <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(userInput) }} />
 * ```
 */
export const sanitizeHTML = (dirtyHTML: string): string => {
  return DOMPurify.sanitize(dirtyHTML, {
    // Whitelist of allowed HTML tags
    ALLOWED_TAGS: [
      'b',      // Bold
      'i',      // Italic
      'em',     // Emphasis
      'strong', // Strong emphasis
      'p',      // Paragraph
      'br',     // Line break
      'ul',     // Unordered list
      'ol',     // Ordered list
      'li',     // List item
      'a',      // Anchor/link
      'span',   // Inline container
    ],
    
    // Whitelist of allowed HTML attributes
    ALLOWED_ATTR: [
      'href',   // For links (will be validated)
      'target', // For link targets (_blank, etc.)
      'rel',    // For link relationships (noopener, noreferrer)
    ],
    
    // Only allow safe protocols in URLs
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):)/i,
    
    // Security settings
    ALLOW_DATA_ATTR: false,              // Block data-* attributes
    ALLOW_UNKNOWN_PROTOCOLS: false,      // Block unknown protocols
    FORCE_BODY: true,                    // Always return <body> contents
    RETURN_DOM: false,                   // Return string, not DOM
    RETURN_DOM_FRAGMENT: false,          // Return string, not DocumentFragment
    SANITIZE_DOM: true,                  // Enable DOM sanitization
    KEEP_CONTENT: true,                  // Keep content of removed tags
    
    // Additional security hooks
    SAFE_FOR_TEMPLATES: true,            // Prevent template injection
  });
};

/**
 * Sanitizes CSS content with extra strict settings.
 * 
 * Used for sanitizing dynamically generated CSS to prevent CSS injection attacks.
 * Removes all HTML tags and only allows plain text.
 * 
 * @param dirtyCSS - The untrusted CSS string to sanitize
 * @returns Sanitized CSS string
 * 
 * @example
 * ```typescript
 * const userCSS = '.class { color: red; } <script>alert("XSS")</script>';
 * const clean = sanitizeCSS(userCSS);
 * // Result: '.class { color: red; }' (script removed)
 * ```
 */
export const sanitizeCSS = (dirtyCSS: string): string => {
  return DOMPurify.sanitize(dirtyCSS, {
    ALLOWED_TAGS: [],        // No HTML tags allowed in CSS
    ALLOWED_ATTR: [],        // No attributes allowed
    FORCE_BODY: true,
    SANITIZE_DOM: true,
  });
};

/**
 * Sanitizes plain text by removing all HTML tags.
 * 
 * Use this when you want to display text content without any HTML formatting.
 * 
 * @param dirtyText - The untrusted text that may contain HTML
 * @returns Plain text with all HTML removed
 * 
 * @example
 * ```typescript
 * const userInput = 'Hello <script>alert("XSS")</script> World';
 * const clean = sanitizePlainText(userInput);
 * // Result: 'Hello  World'
 * ```
 */
export const sanitizePlainText = (dirtyText: string): string => {
  return DOMPurify.sanitize(dirtyText, {
    ALLOWED_TAGS: [],        // Strip all HTML tags
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,      // Keep text content
  });
};
