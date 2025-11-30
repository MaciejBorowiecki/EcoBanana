# EcoBanana - Łowca Roślin

## Cel

System ma na celu wspieranie walki z Inwazyjnymi Gatunkami Obcymi (IGO) roślin w Polsce poprzez angażowanie społeczeństwa (Citizen Science, grywalizacja). Aplikacja umożliwia użytkownikom identyfikację roślin za pomocą zdjęć, ocenę ich inwazyjności oraz zgłaszanie lokalizacji do odpowiednich służb, w bardzo prosty i intuicyjny sposób. Zachęca do aktywnego brania udziału w poszukiwaniu środowiskowych szkodników poprzez system punktów, rankingu i nagród.

## Funkcjonalność

- Skaner AI: Rozpoznawanie gatunków roślin ze zdjęcia (integracja z Pl@ntNet API).
- Weryfikacja IGO: Automatyczne sprawdzanie statusu prawnego i poziomu szkodliwości rośliny w Polsce na podstawie [bazy danych](https://environment.ec.europa.eu/topics/nature-and-biodiversity/invasive-alien-species_en).
- Grywalizacja: Przyznawanie punktów użytkownikom za znalezienie gatunków inwazyjnych.
-Panel Urzędnika: Mapa i lista zgłoszeń dla zarządców terenów (Dashboard).

## Architektura Systemu

### Komponenty:

- Backend: Python (FastAPI) – serce systemu, zarządza logiką i komunikacją.
- Mobile App: React Native – interfejs dla użytkownika końcowego.
- Dashboard: Streamlit – interfejs analityczny dla administracji.
- AI Engine: Zewnętrzne API (Pl@ntNet) do taksonomii roślin.

## Tech Stack

**Backend**
- Język: Python 3.12+
- Framework: FastAPI
- Serwer: Uvicorn (ASGI)
- Klient HTTP: HTTPX (Asynchroniczny)
- Walidacja danych: Pydantic
- Baza wiedzy: Plik CSV (parsed_plants_dp.csv)
- Baza operacyjna: (Docelowo) PostgreSQL / SQLite

**Frontend (Użytkownik)**
- Technologia: React Native / Expo
- Komunikacja: Fetch API (Multipart/Form-Data)

**Frontend (Administrator)**
- Technologia: Streamlit
- Mapy: Folium / Streamlit-Folium
- Wizualizacja: Pandas

## Struktura plików

```
└── EcoBanana
    ├── backend
    │   ├── data
    │   │   ├── data_base_funtions.py
    │   │   ├── igo.csv
    │   │   ├── igoPyter.ipynb
    │   │   └── parsed_plants_dp.csv
    │   ├── identifier.sqlite
    │   ├── main.py
    │   ├── requirements.txt
    │   └── scanner
    │       ├── ai_engine.py
    │       ├── plant_service.py
    │       ├── router.py
    │       └── schemas.py
    ├── frontend
    │   ├── app
    │   │   ├── _layout.tsx
    │   │   ├── modal.tsx
    │   │   └── (tabs)
    │   │       ├── explore.tsx
    │   │       ├── index.tsx
    │   │       └── _layout.tsx
    │   ├── app.json
    │   ├── assets
    │   │   └── images
    │   │       ├── android-icon-background.png
    │   │       ├── android-icon-foreground.png
    │   │       ├── android-icon-monochrome.png
    │   │       ├── favicon.png
    │   │       ├── icon.png
    │   │       ├── partial-react-logo.png
    │   │       ├── react-logo@2x.png
    │   │       ├── react-logo@3x.png
    │   │       ├── react-logo.png
    │   │       └── splash-icon.png
    │   ├── components
    │   │   ├── external-link.tsx
    │   │   ├── haptic-tab.tsx
    │   │   ├── hello-wave.tsx
    │   │   ├── parallax-scroll-view.tsx
    │   │   ├── themed-text.tsx
    │   │   ├── themed-view.tsx
    │   │   └── ui
    │   │       ├── collapsible.tsx
    │   │       ├── icon-symbol.ios.tsx
    │   │       └── icon-symbol.tsx
    │   ├── constants
    │   │   └── theme.ts
    │   ├── eas.json
    │   ├── eslint.config.js
    │   ├── hooks
    │   │   ├── use-color-scheme.ts
    │   │   ├── use-color-scheme.web.ts
    │   │   └── use-theme-color.ts
    │   ├── package.json
    │   ├── package-lock.json
    │   ├── README.md
    │   ├── scripts
    │   │   └── reset-project.js
    │   ├── tsconfig.json
    │   └── utils
    │       └── api.ts
    ├── identifier.sqlite
    ├── LICENSE
    ├── README.md
    └── webview
        └── app.py
