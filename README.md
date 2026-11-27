Why TruckScope exists

Official FMCSA data tells you that a company exists, not whether it is a good place to work. A carrier can list 150 trucks on paper while only 15 are actually running. Authority status, insurance and fleet size from public registries are a starting point, not the truth.

That is why TruckScope is built around reviews from real drivers:

FMCSA data gives the skeleton: USDOT number, location, declared fleet size.
Drivers fill in what no registry knows: real pay, real dispatch, payment delays, equipment condition.
Anything not confirmed by a source is shown as "Not verified", never guessed.

Built by a former US trucking dispatcher (8 years in the industry) for drivers, including Russian- and Spanish-speaking drivers who struggle to find reliable information in their language.

Features
Section	What it does
Companies	Directory of 34,053 US trucking companies from FMCSA data. Search by name or city, filter by state, fleet size and reviews.
Driver reviews	Drivers rate and review carriers. Companies without reviews are clearly marked.
Pay insights	Example market ranges for company drivers (CPM, percentage, sign-on bonus) and owner-operators (percentage, typical weekly deductions, trailer rental).
News	Industry news feed, categorized.
On The Road	Live US weather alerts (National Weather Service) on a map, for the last 24 / 48 hours, plus a truck repair shop catalog.
Languages	Full interface in English, Español and Русский.
Data sources and honesty
Company data: FMCSA public registry. Fleet size is the number declared by the carrier and may not reflect real operations.
Weather alerts: National Weather Service (NWS) public API.
Pay figures: illustrative examples only. Real pay and deductions depend on the company and contract.
Verification: fields without a confirmed source show "Not verified".

TruckScope is an independent project and is not affiliated with FMCSA, NWS or any carrier listed.

Tech stack
Frontend: Vite dev server (localhost:5173), multilingual UI (EN / ES / RU)
Maps: Leaflet + OpenStreetMap
Backend: API in backend/
Infrastructure: Docker & Docker Compose
Project structure
TruckScope/
├── backend/            # API and data import
├── frontend/           # Web application
├── docker-compose.yml  # Local / production orchestration
└── README.md
Getting started
Prerequisites
Docker and Docker Compose, or Node.js 18+
Run with Docker
bash
git clone https://github.com/maxkerim/TruckScope.git
cd TruckScope
docker compose up --build

The app will be available at http://localhost:5173.

Run without Docker
bash
git clone https://github.com/maxkerim/TruckScope.git
cd TruckScope

# backend
cd backend
npm install
npm run dev

# frontend (in a second terminal)
cd frontend
npm install
npm run dev

Copy any .env.example files to .env and fill in the values before starting.

Roadmap
[ ] Driver registration and review submission with moderation
[ ] Reviews: pay, dispatch, payment speed, equipment, would-recommend
[ ] Sorting and USDOT search
[ ] Map clustering and filters by state / alert type
[ ] Translated weather alerts
[ ] Parking, towing, scale houses and legal help directories
[ ] CI/CD with GitHub Actions
Contributing

Issues and pull requests are welcome. If you are a driver and found wrong data about a company, open an issue.

License

MIT. See LICENSE.
