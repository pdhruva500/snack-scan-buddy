# Security Policy

## 🔒 Keeping Your Repository Private

This repository contains a web application with sensitive configuration. To maintain security:

### GitHub Repository Settings

1. **Set Repository to Private**: 
   - Go to Settings → General → Danger Zone
   - Change repository visibility to **Private**
   - This prevents unauthorized access to your code and configuration

### Protecting Sensitive Data

1. **Environment Variables**:
   - Never commit `.env` files to git
   - Use `.env.example` as a template
   - Add actual credentials only in your local `.env` file
   - The `.gitignore` file is configured to exclude `.env` files

2. **Supabase Credentials**:
   - Keep your Supabase URL and keys secure
   - Rotate keys if they are ever exposed
   - Use Supabase's Row Level Security (RLS) policies

3. **API Keys and Secrets**:
   - Never hardcode API keys in source code
   - Use environment variables for all sensitive data
   - Consider using a secrets management service for production

### Best Practices

- ✅ Keep the repository private
- ✅ Use `.env` files for local development (never commit them)
- ✅ Review all commits before pushing to avoid accidental credential exposure
- ✅ Enable two-factor authentication on your GitHub account
- ✅ Regularly update dependencies to patch security vulnerabilities
- ✅ Use Supabase RLS policies to protect your database

## Reporting a Vulnerability

If you discover a security vulnerability, please report it privately to the repository owner.
