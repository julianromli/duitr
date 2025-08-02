# Supabase Security Configuration Guide

This guide covers important security configurations for your Supabase project, including enabling leaked password protection and other security best practices.

## Leaked Password Protection

### Overview
Supabase Auth includes built-in protection against compromised passwords by checking against the HaveIBeenPwned.org Pwned Passwords API. This feature helps prevent users from using passwords that have been exposed in data breaches.

### Current Status
⚠️ **Warning**: Leaked password protection is currently disabled in your Supabase project.

### How to Enable Leaked Password Protection

1. **Access Supabase Dashboard**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication Settings**
   - In the left sidebar, click on "Authentication"
   - Click on "Settings" tab

3. **Configure Password Security**
   - Scroll down to the "Password Security" section
   - Find the "Leaked Password Protection" option
   - Toggle the switch to **Enable** leaked password protection

4. **Save Changes**
   - Click "Save" to apply the changes

### Additional Password Security Recommendations

While enabling leaked password protection, consider implementing these additional security measures:

#### 1. Password Strength Requirements
- **Minimum Length**: Set to at least 8 characters (12+ recommended)
- **Character Requirements**: Require a mix of:
  - Lowercase letters
  - Uppercase letters
  - Numbers
  - Special symbols: `!@#$%^&*()_+-=[]{};'\:"|<>?,./\`~`

#### 2. Configuration Steps
1. In the "Password Security" section of Auth Settings:
2. Set **Minimum password length** to `12` or higher
3. Enable **Require lowercase letters**
4. Enable **Require uppercase letters**
5. Enable **Require numbers**
6. Enable **Require symbols**
7. Enable **Prevent use of leaked passwords** ✅

### Benefits of Leaked Password Protection

- **Enhanced Security**: Prevents users from using passwords that are known to be compromised
- **Reduced Risk**: Significantly lowers the chance of successful credential stuffing attacks
- **User Protection**: Helps protect users who might unknowingly use compromised passwords
- **Compliance**: Aligns with security best practices and compliance requirements

### How It Works

1. When a user creates or updates their password, Supabase checks it against the HaveIBeenPwned database
2. If the password appears in the database of leaked passwords, the request is rejected
3. The user receives a clear error message asking them to choose a different password
4. No actual password data is sent to HaveIBeenPwned (uses k-anonymity model)

### Error Handling

When leaked password protection is enabled, users will see error messages like:

```
WeakPasswordError: Password has been found in a data breach. Please choose a different password.
```

Make sure your application handles these errors gracefully and provides clear guidance to users.

### Testing the Configuration

1. Try registering with a known weak password (e.g., "password123")
2. The system should reject it with an appropriate error message
3. Try with a strong, unique password - it should be accepted

## Additional Security Measures

### Multi-Factor Authentication (MFA)
Consider enabling MFA for additional security:
- Time-based One-Time Passwords (TOTP)
- SMS-based verification
- Email-based verification

### Row Level Security (RLS)
Ensure all your tables have proper RLS policies:
- ✅ All main tables have RLS enabled
- ✅ Backup tables have been secured with appropriate policies

### Function Security
- ✅ All database functions now have `SET search_path = ''` to prevent search path vulnerabilities

## Monitoring and Maintenance

1. **Regular Security Audits**: Use Supabase's Security Advisor to check for new issues
2. **Password Policy Updates**: Review and update password requirements periodically
3. **User Education**: Inform users about password security best practices

## References

- [Supabase Password Security Documentation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- [HaveIBeenPwned Pwned Passwords API](https://haveibeenpwned.com/API/v3#PwnedPasswords)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/database/database-linter)

---

**Note**: After enabling leaked password protection, existing users can still sign in with their current passwords even if they don't meet the new requirements. However, they will be prompted to update their password if it's found to be weak during the sign-in process.