# TruckScope

A trucking industry platform built for professional drivers in the United States.

## Features

- Trucking company directory powered by public FMCSA data
- Trucking industry news
- Truck shops and service locations
- English, Spanish, and Russian interface
- Driver lead management API

## Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React, Vite, JavaScript, CSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL, SQLite |
| Infrastructure | Docker, Docker Compose |
| CI/CD | GitHub Actions |

## Project Structure

```text
TruckScope/
├── .github/workflows/
│   └── ci-cd.yml
├── backend/
│   ├── app/
│   ├── scripts/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   └── package.json
├── docker-compose.yml
└── README.md
