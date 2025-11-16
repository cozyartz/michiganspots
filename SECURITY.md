# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

**Current Version**: 1.0.0 (Alpha)

---

## Reporting a Vulnerability

**We take security seriously.** If you discover a security vulnerability in State Spots, please report it responsibly.

### How to Report

**DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, please email us at:
📧 **security@statespots.com**

### What to Include in Your Report

Please provide as much information as possible:

1. **Description**: What is the vulnerability?
2. **Impact**: What could an attacker do with this vulnerability?
3. **Steps to Reproduce**: Detailed steps to reproduce the issue
4. **Proof of Concept**: Code, screenshots, or video demonstrating the vulnerability
5. **Suggested Fix**: If you have ideas for how to fix it (optional)
6. **Environment**: Browser, OS, device type where you found the vulnerability
7. **Your Contact Info**: How we can reach you for follow-up

**Example Report**:
```
Subject: [SECURITY] SQL Injection in Business Search

Description:
The business search endpoint at /api/directory/search is vulnerable to SQL injection.

Impact:
An attacker could read or modify database contents, including user data and business information.

Steps to Reproduce:
1. Navigate to /directory
2. Enter the following in the search box: ' OR '1'='1
3. Observe that all businesses are returned, bypassing filters

Proof of Concept:
[Attach screenshot or code snippet]

Environment:
- Browser: Chrome 120
- OS: macOS 14.2

Contact: researcher@example.com
```

---

## Our Commitment

When you report a vulnerability, we commit to:

1. **Acknowledge Receipt** within 48 hours
2. **Provide Initial Assessment** within 7 days
3. **Keep You Updated** on our progress
4. **Credit You** (if desired) when we publish the fix
5. **No Legal Action** against good-faith security researchers

---

## Security Response Timeline

| Severity | Initial Response | Fix Target | Public Disclosure |
|----------|-----------------|------------|-------------------|
| Critical | 24 hours | 7 days | After fix deployed |
| High | 48 hours | 14 days | After fix deployed |
| Medium | 7 days | 30 days | After fix deployed |
| Low | 14 days | 90 days | After fix deployed |

**Severity Definitions**:

- **Critical**: Remote code execution, privilege escalation, data breach
- **High**: Authentication bypass, significant data exposure
- **Medium**: XSS, CSRF, information disclosure
- **Low**: Minor security issues with limited impact

---

## Bug Bounty Program

**Status**: Not currently available

We do not currently offer a bug bounty program. However, we are grateful for responsible disclosure and will:
- Credit you in our security acknowledgments
- Offer State Spots swag (coming soon)
- Consider future compensation as the project grows

We may establish a formal bug bounty program in the future.

---

## Security Best Practices

### For Users

To keep your State Spots account secure:

✅ **Use a strong, unique password** (if using native auth)
✅ **Enable two-factor authentication** (coming soon)
✅ **Don't share your account credentials**
✅ **Log out when using shared devices**
✅ **Be cautious of phishing emails** (we'll never ask for your password)
✅ **Keep your browser and OS updated**
✅ **Report suspicious activity** to security@statespots.com

### For Contributors

If you're contributing code to State Spots:

✅ **Never commit secrets** (.env files, API keys, passwords)
✅ **Use environment variables** for sensitive configuration
✅ **Sanitize user inputs** to prevent XSS and SQL injection
✅ **Validate data** on both client and server
✅ **Use parameterized queries** for database operations
✅ **Implement rate limiting** for API endpoints
✅ **Follow OWASP Top 10** security guidelines
✅ **Run security scans** before submitting PRs (when available)

---

## Known Security Measures

State Spots implements the following security controls:

### Authentication & Authorization
- Session-based authentication via Lucia
- Secure httpOnly cookies with SameSite=Strict
- CSRF token protection
- Role-based access control (user, partner, admin)
- Reddit OAuth 2.0 integration

### Data Protection
- HTTPS/TLS encryption for all traffic
- Database encryption at rest (Cloudflare D1)
- Secure password hashing with bcrypt
- Input sanitization and validation
- Prepared statements for SQL queries

### Infrastructure Security
- Cloudflare WAF (Web Application Firewall)
- DDoS protection via Cloudflare
- Rate limiting on API endpoints
- Automated security updates for dependencies
- Error monitoring with Sentry (sanitized data)

### Application Security
- Content Security Policy (CSP) headers
- X-Frame-Options to prevent clickjacking
- XSS protection headers
- Secure file upload restrictions
- Input validation with Zod schemas

---

## Security Vulnerability Disclosure Timeline

When we fix a security vulnerability, we follow this process:

1. **Private Patch**: Fix developed in a private repository
2. **Testing**: Thorough testing of the fix
3. **Deployment**: Deploy fix to production
4. **Notification**: Notify affected users (if applicable)
5. **Public Disclosure**: Publish security advisory 14 days after fix
6. **Credit**: Acknowledge the researcher (with permission)

---

## Security Audits

**Last Security Audit**: N/A (Project in Alpha)
**Next Planned Audit**: Q2 2025 (before public launch)

We plan to conduct regular security audits as the project matures. If you're a security professional interested in auditing State Spots, please contact security@statespots.com.

---

## Responsible Disclosure

We kindly request that security researchers:

✅ **Do**:
- Allow us reasonable time to fix the issue before public disclosure
- Make a good faith effort not to access or modify user data
- Test only against your own accounts or test accounts we provide
- Report the vulnerability privately to security@statespots.com

❌ **Don't**:
- Exploit the vulnerability beyond what is necessary to demonstrate it
- Access or modify other users' data
- Perform denial-of-service attacks
- Spam or social engineer State Spots users or staff
- Publicly disclose the vulnerability before we've had time to fix it

**Safe Harbor**: We will not pursue legal action against researchers who follow responsible disclosure practices and act in good faith.

---

## Security Contact

For all security-related matters:

📧 **Email**: security@statespots.com
🔐 **PGP Key**: [Coming soon]
⏰ **Response Time**: Within 48 hours

**Non-Security Issues**: Please use our [regular support channels](https://statespots.com/contact)

---

## Security Acknowledgments

We thank the following individuals for responsibly disclosing security vulnerabilities:

*(No vulnerabilities reported yet - you could be first!)*

---

## Legal

**No Backdoors**: State Spots does not contain intentional security backdoors. We will resist any attempts to compel us to introduce backdoors.

**Compliance**: State Spots complies with applicable security and privacy laws, including GDPR, CCPA, and Michigan data protection regulations.

**Third-Party Services**: We use trusted third-party services (Cloudflare, Stripe, Sentry) and rely on their security certifications. See our [Privacy Policy](/privacy) for details.

---

**Last Updated**: January 15, 2025
**Next Review**: April 15, 2025

**© 2025 Cozyartz Media Group d/b/a State Spots. All Rights Reserved.**
