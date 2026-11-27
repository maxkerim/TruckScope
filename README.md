# 🚛 TruckScope

**Comprehensive Trucking Information Platform & Directory for the US Market**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Status](https://img.shields.io/badge/Status-Active-success.svg)]()
[![DevOps](https://img.shields.io/badge/DevOps-Docker%20%7C%20CI%2FCD-blue)]()

---

## 📖 About the Project

**TruckScope** is a multilingual information platform and directory designed specifically for the US trucking industry. It aggregates official FMCSA safety data, transparent pay rates, and essential "On The Road" services into one intuitive interface. 

Unlike generic job boards, TruckScope is built with deep industry insight, offering dedicated localization and support for **English, Russian, and Spanish-speaking drivers**, bridging the information gap for immigrant truckers in the USA.

> 💡 **Origin Story:** Built by a former US trucking dispatcher with 8 years of hands-on industry experience, this project solves real pain points: fragmented company data, lack of transparent safety/pay metrics, and language barriers on the road.

---

## ✨ Key Features

### 🏢 Trucking Directory & FMCSA Integration
- Database of **34,000+ US trucking companies**.
- Real-time integration with **FMCSA SAFER data** (USDOT verification, Safety Ratings, Out-of-Service rates).
- **Amazon Relay Ready** badge: Automated compliance check showing which carriers meet Amazon's strict requirements.

### 💰 Transparent Compensation Insights
- Clear breakdowns of average market pay for **Company Drivers** (CPM, weekly guarantees, sign-on bonuses) vs. **Owner-Operators** (gross percentage, typical weekly deductions for IFTA, insurance, and rentals).

### 🗺️ "On The Road" Directory
- Curated map and listings for essential services: Truck repair shops, safe overnight parking, 24/7 towing & recovery, and weigh stations (Scale Houses).
- Dedicated section for **Legal & Immigration Help** and **Russian/Spanish-speaking dispatchers**.

### 📰 Multilingual News & Real-Time Alerts
- Aggregated live RSS feeds from top industry sources (FreightWaves, Truckers News).
- **Instant AI-assisted translation** of critical alerts (road closures, multi-vehicle accidents, FMCSA regulation changes) into EN, RU, and ES.
- Categorized feeds: Safety, Freight Market, Technology & ELD, and Weather/Routes.

---

## 🛠️ Tech Stack & DevOps Highlights

*This project serves as a comprehensive DevOps portfolio case, demonstrating end-to-end deployment, automation, and monitoring.*

- **Frontend:** [Next.js / React], [Tailwind CSS], `i18next` (for seamless EN/RU/ES localization)
- **Backend:** [Node.js (Express) / Python (FastAPI)]
- **Database:** [PostgreSQL / MongoDB]
- **Infrastructure & DevOps:** 
  - 🐳 **Docker & Docker Compose** for containerized local development and production consistency.
  - 🔄 **GitHub Actions** for automated CI/CD pipelines (linting, testing, and auto-deployment).
  - 🌐 **Nginx** as a reverse proxy with SSL termination (Let's Encrypt).
  - 📊 **[Optional: Prometheus & Grafana / Uptime Kuma]** for application monitoring and RSS feed health checks.
- **External APIs:** FMCSA SAFER Web API, RSS Feed Parsers, [Google Maps API / Translation API].

---

## 🚀 Getting Started

### Prerequisites
- Node.js `[v18+]` or Python `[v3.10+]`
- Docker & Docker Compose

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/maxkerim/TruckScope.git
   cd TruckScope
