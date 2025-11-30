# EcoBanana - Łowca Roślin

## Cel

System ma na celu wspieranie walki z Inwazyjnymi Gatunkami Obcymi (IGO) roślin w Polsce poprzez angażowanie społeczeństwa (Citizen Science, grywalizacja). Aplikacja umożliwia użytkownikom identyfikację roślin za pomocą zdjęć, ocenę ich inwazyjności oraz zgłaszanie lokalizacji do odpowiednich służb, w bardzo prosty i intuicyjny sposób. Zachęca do aktywnego brania udziału w poszukiwaniu środowiskowych szkodników poprzez system punktów, rankingu i nagród.

## Funkcjonalność

- Skaner AI: Rozpoznawanie gatunków roślin ze zdjęcia (integracja z Pl@ntNet API).
- Weryfikacja IGO: Automatyczne sprawdzanie statusu prawnego i poziomu szkodliwości rośliny w Polsce na podstawie [bazy danych]([https://environment.ec.europa.eu/topics/nature-and-biodiversity/invasive-alien-species_en](https://dane.gov.pl/pl/dataset/1760,baza-danych-o-inwazyjnych-gatunkach-obcych-roslin-i-zwierzat/resource/21068/table?page=1&per_page=20&q=&sort=)).
- Grywalizacja: Przyznawanie punktów użytkownikom za znalezienie gatunków inwazyjnych.
- Panel Urzędnika: Mapa i lista zgłoszeń dla zarządców terenów (Dashboard).

## Workflow

1. Warstwa Kliencka (Mobile Input) Aplikacja mobilna, oparta na React Native (Expo), wykorzystuje bibliotekę expo-camera do akwizycji obrazu oraz expo-location do pobrania metadanych geoprzestrzennych. Dane są przesyłane jako strumień binarny (UploadFile) za pośrednictwem żądania HTTP POST do dedykowanego endpointu /scan.

2. Warstwa Logiki i Inferencji (Backend Processing) Serwer FastAPI obsługuje żądanie, inicjując połączenie (httpx.AsyncClient) z zewnętrznym API Pl@ntNet (mvp) w celu klasyfikacji inwazyjności rośliny. Uzyskana nazwa łacińska jest mapowana na lokalny zbiór danych (załadowany do pamięci z pliku CSV przetworzonego wcześniej przez Pandas) w celu weryfikacji statusu IGO (Inwazyjnego Gatunku Obcego).

3. Warstwa Danych (Data Base) W przypadku pozytywnej identyfikacji, moduł bazy danych wykonuje transakcje SQLite: rekord zgłoszenia jest insertowany do tabeli discoveries, a stan konta użytkownika w tabeli users jest aktualizowany o wyliczoną wartość punktową.

4. Wasrtwa Administracyjna (Webview) Panel administracyjny agreguje te dane poprzez zapytania SQL JOIN, generując listy zadań interwencyjnych dla służb terenowych. 

## Architektura Systemu

### Komponenty:

- Backend: Python (FastAPI) – serce systemu, zarządza logiką i komunikacją.
- Mobile App: React Native – interfejs dla użytkownika końcowego.
- Dashboard: Streamlit – interfejs analityczny dla administracji.
- AI Engine: Zewnętrzne API (Pl@ntNet) do taksonomii roślin.

## Jak Skorzystać

0. Warto stworzyć wirtualne środowisko VENV
```bash
    python3 -m venv venv
    source venv/bin/activate
```

1. Postawienie lokalnego serwera (MVP)

    a. Aby skorzystać z API Pl@ntAPI, które jest wykorzystane do rozpoznawania roślin należy założyć (darmowe) konto na stronie [Pl@ntAPI](https://my.plantnet.org/), i w zakładce `Settings` skopiować API key. Następnie należy w folderze `EcoBanana/backend` utworzyć plik `.env` a jego zawartość musi wygląć następująco:

```api
PLANTNET_API_KEY=klucz_wygenerowany_na_Pl@ntAI
```

```bash
    cd EcoBanana/backend
    pip install -r requirements.txt
    uvicorn main:app --host 0.0.0.0 --port 5555
```

2. Uruchomienie interfejsu użytkownika
   
    a. jeżeli `requirements.txt` nie zainstalowane to należy to najpierw wykonać

```bash
    cd EcoBanana/webview
    streamlit run app.py
```

3. Uruhomienie aplikacji na telefonie

Należy pobrać `LowcyRoslin.apk` z releases na [repozytorium](https://github.com/MaciejBorowiecki/EcoBanana) *Działą wyłącznie na systemie Android* i **Konieczne jest *(wersja mvp)* aby telefon i komputer na ktorym postawiony jest serwer były na tym samym *prywatnym (aby ograniczyć problemy z firewallem)* wifi**.


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
