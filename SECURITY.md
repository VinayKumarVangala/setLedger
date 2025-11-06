# 🔒 Security Guidelines

## 🚨 Important Security Notice

This project contains sensitive configuration templates. Follow these guidelines to maintain security:

## 🔑 Environment Variables

### ⚠️ Never Commit These Files:
- `.env` (any environment file)
- `secrets/` directory
- `keys/` directory  
- Any file containing actual API keys or passwords

### ✅ Safe to Commit:
- `.env.example` files (templates only)
- Configuration with placeholder values
- Documentation and setup guides

## 🛡️ Security Checklist

### Before First Run:
1. **Copy environment templates:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   cp ai-service/.env.example ai-service/.env
   ```

2. **Generate secure secrets:**
   ```bash
   # Generate JWT secrets (minimum 32 characters)
   openssl rand -base64 32
   
   # Generate KMS key for TOTP encryption
   openssl rand -base64 32
   ```

3. **Update all placeholder values** in `.env` files with real credentials

4. **Set proper file permissions:**
   ```bash
   chmod 600 .env backend/.env frontend/.env ai-service/.env
   ```

### Database Security:
- Use strong database passwords
- Enable SSL/TLS for database connections
- Restrict database access to application servers only
- Regular database backups with encryption

### API Security:
- Rotate API keys regularly
- Use environment-specific API keys
- Monitor API usage and set rate limits
- Implement proper CORS policies

### Authentication Security:
- JWT tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- TOTP secrets are encrypted with KMS keys
- Passwords hashed with bcrypt (12 rounds)

## 🔐 Production Deployment

### Environment Variables:
```bash
# Production settings
NODE_ENV=production
FLASK_ENV=production
REACT_APP_DEBUG_MODE=false

# Security headers
HELMET_ENABLED=true
CORS_ORIGIN=https://yourdomain.com

# Database
# Use connection pooling and SSL
POSTGRES_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Security Headers:
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options

### Monitoring:
- Enable security logging
- Monitor failed authentication attempts
- Track API usage patterns
- Set up alerts for suspicious activity

## 🚫 What NOT to Include in Git

### Sensitive Files:
```
.env
.env.local
.env.production
secrets/
keys/
*.pem
*.key
*.crt
config/production.json
```

### Generated Files:
```
node_modules/
build/
dist/
*.log
.cache/
```

## 📋 Security Audit

Run security audits regularly:

```bash
# NPM audit
npm audit
npm audit fix

# Dependency check
npm outdated

# Security scan
npm run security:audit
```

## 🆘 Security Incident Response

If you suspect a security breach:

1. **Immediately rotate all secrets:**
   - JWT secrets
   - API keys
   - Database passwords
   - TOTP encryption keys

2. **Check logs for:**
   - Unusual access patterns
   - Failed authentication attempts
   - Unexpected API calls

3. **Update dependencies:**
   ```bash
   npm update
   npm audit fix --force
   ```

## 📞 Reporting Security Issues

If you discover a security vulnerability:
- **DO NOT** create a public GitHub issue
- Contact the maintainers privately
- Provide detailed information about the vulnerability
- Allow time for the issue to be fixed before disclosure

---

**Remember: Security is everyone's responsibility. When in doubt, err on the side of caution.**