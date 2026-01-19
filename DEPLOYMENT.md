# Deployment Guide for FileVora

This guide covers how to deploy the FileVora application to a production environment.

## Prerequisites

- **Docker & Docker Compose**: Ensure Docker is installed on your server.
- **Git**: To clone the repository.
- **PostgreSQL Database**: You can use a managed service (Supabase, AWS RDS, Railway) or run one via Docker.

## Environment Variables

Create a `.env` file in the root directory (or configure these in your deployment platform).

```ini
# Backend
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET_KEY=your-secure-random-secret-key-change-this
ALLOWED_ORIGINS=["https://yourdomain.com", "http://localhost:3000"]

# Frontend (Build time)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
```

> [!IMPORTANT]
> - `DATABASE_URL` format: `postgresql://user:password@host:port/dbname`
> - `JWT_SECRET_KEY` should be a long, random string.
> - `NEXT_PUBLIC_API_URL` must point to your production backend URL.

## Deployment with Docker Compose

For a simple single-server deployment, you can use the included `docker-compose.yml`.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/filevora.git
   cd filevora
   ```

2. **Configure Environment:**
   Update `docker-compose.yml` or use a `.env` file. 
   
   If using an external PostgreSQL database, update the `DATABASE_URL` environment variable in `docker-compose.yml` or your `.env`.

3. **Build and Run:**
   ```bash
   docker-compose up -d --build
   ```

4. **Verify Deployment:**
   - Frontend: `http://your-server-ip:3000`
   - Backend API: `http://your-server-ip:8000`
   - Admin Panel: `http://your-server-ip:8000/admin`

## Database Migrations

Currently, the application uses `Base.metadata.create_all(bind=engine)` in `main.py` -> `lifespan` which automatically creates tables if they don't exist. This is sufficient for initial deployment.

For future schema changes, integrating **Alembic** is recommended.

## Production Checklist

- [ ] **Security**: Change `JWT_SECRET_KEY` to a strong secret.
- [ ] **HTTPS**: Set up a reverse proxy (Nginx, Traefik, or Cloudflare Tunnel) to serve the application over HTTPS.
- [ ] **Database**: Use a managed PostgreSQL database for data persistence and reliability.
- [ ] **Storage**: For ephemeral storage cleanup, the backend runs a background task. Ensure the `storage` volume is mounted correctly if persistence is needed (though for FileVora, files are temporary).

## Troubleshooting

### Admin Panel Access
If you cannot access `/admin`:
- Ensure the backend is running.
- Check browser console for network errors.
- Verify `DATABASE_URL` is correct and the database is reachable.

### Database Connection Errors
- Check `docker-compose logs backend` for connection details.
- Ensure the PostgreSQL user has correct permissions.
- If using `localhost` inside Docker, remember `localhost` refers to the container. Use `host.docker.internal` or the service name `db` if running a Postgres container.
