# Plant Hunter

## Goal

The system aims to support the fight against Invasive Alien Species (IGO) of plants in Poland by engaging the public (Citizen Science, gamification). The application allows users to identify plants using photos, assess their invasiveness, and report locations to the appropriate services in a very simple and intuitive way. It encourages active participation in searching for environmental pests through a points system, ranking, and rewards.

## Functionality

- AI Scanner: Recognition of plant species from a photo (integration with Pl@ntNet API).
- IGO Verification: Automatic checking of the legal status and level of harmfulness of a plant in Poland based on the [database](https://dane.gov.pl/pl/dataset/1760,baza-danych-o-inwazyjnych-gatunkach-obcych-roslin-i-zwierzat/resource/21068/table?page=1&per_page=20&q=&sort=).
- Gamification: Awarding points to users for finding invasive species.
- Official Panel: Map and list of reports for land managers (Dashboard).

## Workflow

1. Client Layer (Mobile Input)  
   The mobile application, based on React Native (Expo), uses the expo-camera library for image acquisition and expo-location to retrieve geospatial metadata. Data is transmitted as a binary stream (UploadFile) via an HTTP POST request to a dedicated `/scan` endpoint.

2. Logic and Inference Layer (Backend Processing)  
   A FastAPI server handles the request, initiating a connection (`httpx.AsyncClient`) with the external Pl@ntNet API (MVP) to classify the plant's invasiveness. The obtained Latin name is mapped to a local dataset (loaded into memory from a CSV file preprocessed earlier with Pandas) in order to verify the IGO (Invasive Alien Species) status.

3. Data Layer (Data Base)  
   In the case of a positive identification, the database module executes SQLite transactions: a report record is inserted into the `discoveries` table, and the user's account balance in the `users` table is updated with the calculated point value.

4. Administrative Layer (Webview)  
   The administrative panel aggregates this data through SQL JOIN queries, generating lists of intervention tasks for field services.

## System Architecture

### Components:

- Backend: Python (FastAPI) – the heart of the system, manages logic and communication.
- Mobile App: React Native – end-user interface.
- Dashboard: Streamlit – analytical interface for administration.
- AI Engine: External API (Pl@ntNet) for plant taxonomy.

## How to Use

0. It is worth creating a virtual environment VENV
```bash
    python3 -m venv venv
    source venv/bin/activate
```

1. Running a local server (MVP)

    a. To use the Pl@ntAPI, which is used for plant recognition, you must create a (free) account on the [Pl@ntAPI](https://my.plantnet.org/) website, and in the `Settings` tab copy the API key. Then create a `.env` file in the `Plant Hunter/backend` folder and its content must look like this:

```api
PLANTNET_API_KEY=key_generated_on_Pl@ntAI
```

```bash
    cd Plant Hunter/backend
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 5555
```

2. Running the user interface

    a. if `requirements.txt` not installed then do it first

```bash
    cd Plant Hunter/webview
    streamlit run app.py
```

3. Running the app on the phone

Download `LowcyRoslin.apk` from releases on the [repository](https://github.com/MaciejBorowiecki/Plant-Hunter) *Works only on Android* and **It is necessary *(MVP version)* that the phone and the computer running the server are on the same *private (to limit firewall problems)* Wi-Fi** *(IP must be set to 10.137.235.39)*.

## Tech Stack

**Backend**
- Language: Python 3.12+
- Framework: FastAPI
- Server: Uvicorn (ASGI)
- HTTP Client: HTTPX (Asynchronous)
- Data validation: Pydantic
- Knowledge base: CSV file (parsed_plants_dp.csv)
- Operational DB: (Eventually) PostgreSQL / SQLite

**Frontend (User)**
- Technology: React Native / Expo
- Communication: Fetch API (Multipart/Form-Data)

**Frontend (Administrator)**
- Technology: Streamlit
- Maps: Folium / Streamlit-Folium
- Visualization: Pandas

## File Structure

```
Plant Hunter
├── backend/
│   ├── data/             # CSV datasets (IGO list) & Database logic
│   ├── scanner/          # AI integration (Pl@ntNet) & API routes
│   └── main.py           # FastAPI server entry point
├── frontend/             # React Native (Expo) mobile application
│   ├── app/              # Screens (Camera, Map, Profile) & Navigation
│   └── utils/            # API client functions
├── webview/              # Admin dashboard (Streamlit) for officials
└── identifier.sqlite     # SQLite database storing users and findings
```

**Legend:**

`backend/`: The core logic powered by **FastAPI**. It handles image processing, communicates with the external AI API, and manages the local database.

`backend/data/`: Contains the "knowledge base"—CSV files listing invasive species (IGO) and scripts to parse them into the system.

`frontend/`: The mobile user interface built with **React Native (Expo)**. It handles camera access, user geolocation, and gamification elements (points/rewards).

`webview/`: A **Streamlit** web application serving as a control panel for authorities to visualize reported invasive plants on a map.