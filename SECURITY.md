# Security

If you believe you have found a security vulnerability in this framework, please report it responsibly.

- Prefer private disclosure to the maintainer (see repository contact or `package.json` author email).
- Do not open a public issue for undisclosed vulnerabilities.

## Scope

This package is a Fastify application bootstrapper. Security of your deployed API also depends on your routes, drivers, authentication configuration, dependency versions, and infrastructure (TLS termination, secrets management, network policy).

## TLS and proxies

Do not disable TLS verification globally in production (`NODE_TLS_REJECT_UNAUTHORIZED`). When running behind a reverse proxy, configure Fastify `trustProxy` in your application config only when the proxy strips or sets forwarded headers correctly.
