import mariadb
import streamlit as st

def conectar():
    return mariadb.connect(
        host=st.secrets["mariadb"]["host"],
        port=st.secrets["mariadb"]["port"],
        user=st.secrets["mariadb"]["user"],
        password=st.secrets["mariadb"]["password"],
        database=st.secrets["mariadb"]["database"],
        autocommit=True
    )