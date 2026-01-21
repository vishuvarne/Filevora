# FileVora Scaling & Deployment Guide

## Overview
This guide describes how to scale FileVora to handle **1 Million+ Visitors per Month**. 
The architecture supports horizontal scaling by offloading state to external services (S3, Redis, Postgres).

---

## 1. Environment Configuration

To enable scaling, set the following environment variables in your production environment (Render, AWS, etc.):

### Storage (AWS S3)
*Required for stateless file processing across multiple workers.*
```bash
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your_bucket_name
```

### Caching & Rate Limiting (Redis)
*Required for distributed rate limiting.*
```bash
REDIS_URL=redis://your_redis_host:port
```

### Database (PostgreSQL)
*Required for persisting user history and auth.*
```bash
DATABASE_URL=postgresql://user:pass@host/dbname
```

### Frontend (AdSense & CDN)
```bash
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_AD_SLOT_TOP=1234567890
NEXT_PUBLIC_AD_SLOT_BOTTOM=0987654321
```

---

## 2. Infrastructure Architecture

### Backend (Traffic Handling)
- **Service**: Render Web Service / AWS EC2 / Kubernetes
- **Scaling**: 
  - Run **multiple instances** (e.g., 5-10 nodes).
  - Use `gunicorn` with multiple workers: `gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app`.
  - **Auto-Scaling**: Configure CPU-based auto-scaling (scale up at 60% CPU).

### File Storage (S3)
- **Why**: Local disk fills up and isn't shared between instances.
- **Config**: Ensure `AWS_BUCKET_NAME` is set. The backend automatically switches from local storage to S3.
- **Lifecycle Rule**: Set an S3 Lifecycle Rule to **delete objects after 1 hour** (matching the app's retention policy) to save costs.

### Async Processing (Queue - Recommended for >1M)
- Current implementation uses `FastAPI BackgroundTasks` and `run_in_threadpool`.
- **Next Step**: For extreme load, decouple PDF/Video processing using **Celery + Redis**.

### Database
- Switch from SQLite to **PostgreSQL**.
- Use connection pooling (SQLAlchemy engine in `database.py` handles this, but verify pool size).

### CDN (Cloudflare)
- Put **Cloudflare** in front of your Frontend (Firebase) and Backend (Render).
- Enable **Caching** for static assets.
- Enable **DDos Protection**.

---

## 3. AdSense Integration
Ads are implemented non-intrusively:
1.  **Top Banner**: Below breadcrumbs, above the tool interface.
2.  **Bottom Banner**: Below the process button/results, above the info section.

**To Enable:**
1.  Get approved by Google AdSense.
2.  Add your `ca-pub-ID` to `NEXT_PUBLIC_GOOGLE_ADSENSE_ID`.
3.  Create 2 Display Ad Units (Responsive) in AdSense console.
4.  Add their Slot IDs to `NEXT_PUBLIC_AD_SLOT_TOP` and `NEXT_PUBLIC_AD_SLOT_BOTTOM`.

---

## 4. Checklist for Launch
- [ ] Set up S3 Bucket with CORS enabled.
- [ ] Set up auto-deleting lifecycle policy on S3.
- [ ] Provision managed Redis (e.g., Upstash or Render Redis).
- [ ] Provision managed Postgres (e.g., Neon or Render Postgres).
- [ ] Add Environment Variables.
- [ ] Deploy!
