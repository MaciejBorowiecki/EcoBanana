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

submission = list(MOCK_SUBMISSIONS)
for s in submission:
    s = list(s)
    s[2] = s[2].split(",")
#print(submissions)
#submissions[2] = submissions[2].split(",")



if "loggedIn" not in st.session_state:
    st.session_state.loggedIn = False
if "current_user" not in st.session_state:
    st.session_state.current_user = None

users = [Klerk("szymon", "banan")]

def register():
    st.subheader("Create account")
    login_input = st.text_input("Registration Login", key="reg_login")
    haslo_input = st.text_input("Registration Password", type="password", key="reg_pass")
    if st.button("Register"):
        if any(u.login == login_input for u in st.session_state.users):
            st.error("User already exists")
        else:
            users.append(Klerk(login_input, haslo_input))
            st.success("Account created!")


def login():
    st.subheader("Log in")
    login_input = st.text_input("Login", key="login_field")
    haslo_input = st.text_input("Password", type="password", key="pass_field")
    if st.button("Log in"):
        for user in users:
            if user.login == login_input and user.haslo == haslo_input:
                st.session_state.loggedIn = True
                st.session_state.current_user = user
                st.rerun()
        else:
            st.error("Invalid login credentials")


def main_panel():
    st.title("Official's Panel")

    st.header("Reports Map")

    m = folium.Map(location=[52.2200, 21.0000], zoom_start=12)
    folium_static(m, width=1000, height=500)


    st.header("Reports List")


    st.dataframe(
        use_container_width=True
    )

    if st.button("Log out"):
        st.session_state.loggedIn = False
        st.session_state.current_user = None
        st.rerun()

ListaUrzednikow = []

if st.session_state.loggedIn:
    main_panel()
else:
    option = st.radio("Choose option:", ["Log in", "Create account"])
    if option == "Log in":
        login()

    else:
        register()