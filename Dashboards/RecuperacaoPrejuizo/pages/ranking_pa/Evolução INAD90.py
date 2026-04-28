import pandas as pd
import streamlit as st
import plotly.graph_objects as go
from db.connection import conectar

st.set_page_config(
    layout="wide",
    page_title="Evolução INAD 90",
    page_icon="logo.png"
)

st.title("Evolução INAD 90 x Recuperação de Prejuízo")

# CONEXÃO COM O BANCO
conn = conectar()

# QUERY – EVOLUÇÃO MENSAL
query = """
SELECT
    YEAR(Meses) AS Ano,
    MONTH(Meses) AS Mes,
    SUM(INAD_90) AS INAD_90,
    SUM(Recupera_o_Prejuizo_APN) AS Recuperacao_APN
FROM INAD_90
GROUP BY YEAR(Meses), MONTH(Meses)
ORDER BY YEAR(Meses), MONTH(Meses);
"""

df = pd.read_sql(query, conn)
conn.close()

meses_pt = {
    1: "janeiro", 2: "fevereiro", 3: "março", 4: "abril",
    5: "maio", 6: "junho", 7: "julho", 8: "agosto",
    9: "setembro", 10: "outubro", 11: "novembro", 12: "dezembro"
}

df["Label"] = df["Mes"].map(meses_pt) + "/" + df["Ano"].astype(str)

df = df.sort_values(["Ano", "Mes"])

# GRÁFICO – BARRA (INAD) + LINHA (RECUPERAÇÃO)
fig = go.Figure()

# Barra – INAD 90
fig.add_bar(
    x=df["Label"],
    y=df["INAD_90"],
    name="INAD 90",
    marker_color="#0B6E4F"
)

# Linha – Recuperação APN
fig.add_scatter(
    x=df["Label"],
    y=df["Recuperacao_APN"],
    name="Recuperação Prejuízo APN",
    mode="lines+markers",
    marker=dict(color="#B11226", size=7),
    yaxis="y2"
)

fig.update_layout(
    title="",
    xaxis=dict(
        title="Mês / Ano",
        type="category",
        tickangle=-45
    ),
    yaxis=dict(
        title="INAD 90 (R$)",
        tickprefix="R$ ",
        showgrid=True
    ),
    yaxis2=dict(
        title="Recuperação APN (R$)",
        overlaying="y",
        side="right",
        tickprefix="R$ "
    ),
    legend=dict(
        orientation="h",
        x=0,
        y=1.15
    ),
    bargap=0.25,
    height=600
)

st.plotly_chart(fig, use_container_width=True)

# TABELA – DETALHAMENTO MENSAL
st.subheader("Detalhamento Mensal – Prejuízo x Recuperação")

def formato_real(valor):
    return f"R$ {valor:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

tabela = pd.DataFrame({
    "Mês / Ano": df["Label"],
    "INAD 90": df["INAD_90"].apply(formato_real),
    "Recuperação Prejuízo APN": df["Recuperacao_APN"].apply(formato_real)
})

st.dataframe(
    tabela,
    use_container_width=True,
    hide_index=True
)
