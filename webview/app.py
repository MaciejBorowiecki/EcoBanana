import streamlit as st
import pandas as pd
import folium
from streamlit_folium import folium_static
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from backend.data.data_base_funtions import plants_to_dig , log_discovery

class Klerk:
    def __init__(self, login, haslo):
        self.login = login
        self.haslo = haslo


# Mock data

MOCK_SUBMISSIONS = plants_to_dig()

for submission in MOCK_SUBMISSIONS:
    submission[3] = submission[3].split(",")



if "loggedIn" not in st.session_state:
    st.session_state.loggedIn = False
if "current_user" not in st.session_state:
    st.session_state.current_user = None

users = [Klerk("szymon", "banan")]

def register():
    st.subheader("Załóż konto")
    login_input = st.text_input("Login do rejestracji", key="reg_login")
    haslo_input = st.text_input("Hasło do rejestracji", type="password", key="reg_pass")
    if st.button("Zarejestruj"):
        if any(u.login == login_input for u in st.session_state.users):
            st.error("Użytkownik już istnieje")
        else:
            users.append(Klerk(login_input, haslo_input))
            st.success("Konto utworzone!")


def login():
    st.subheader("Zaloguj się")
    login_input = st.text_input("Login", key="login_field")
    haslo_input = st.text_input("Hasło", type="password", key="pass_field")
    if st.button("Zaloguj"):
        for user in users:
            if user.login == login_input and user.haslo == haslo_input:
                st.session_state.loggedIn = True
                st.session_state.current_user = user
                st.rerun()
        else:
            st.error("Nieprawidłowe dane logowania")


def main_panel():
    st.title("Panel Urzędnika")

    st.header("Mapa Zgłoszeń")

    m = folium.Map(location=[52.2200, 21.0000], zoom_start=12)

    status_colors = {
        "NOWE": "red",
        "W TRAKCIE": "orange",
        "ZAKOŃCZONE": "green"
    }

    for submission in MOCK_SUBMISSIONS:
        color = status_colors.get(submission['status'], 'blue')

        popup_text = f"""
        <b>{submission['plant_name']}</b><br>
        Status: {submission['status']}<br>
        Adres: {submission['address']}
        """

        folium.Marker(
            [submission['latitude'], submission['longitude']],
            popup=popup_text,
            tooltip=submission['plant_name'],
            icon=folium.Icon(color=color, icon='info-sign')
        ).add_to(m)

    folium_static(m, width=1000, height=500)


    st.header("Lista Zgłoszeń")


    st.dataframe(
        use_container_width=True
    )

    if st.button("Wyloguj"):
        st.session_state.loggedIn = False
        st.session_state.current_user = None
        st.rerun()

ListaUrzednikow = []

if st.session_state.loggedIn:
    main_panel()
else:
    option = st.radio("Wybierz opcję:", ["Zaloguj się", "Załóż konto"])
    if option == "Zaloguj się":
        login()

    else:
        register()