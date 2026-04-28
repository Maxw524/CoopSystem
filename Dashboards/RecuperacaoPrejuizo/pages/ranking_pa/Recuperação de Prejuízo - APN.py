import pandas as pd
import streamlit as st
import plotly.express as px
from db.connection import conectar

st.set_page_config(
    layout="wide",
    page_title="Recuperação de Prejuízo – APN",
    page_icon="logo.png"
)

st.title("Recuperação de Prejuízo (APN)")

meses_pt = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
}

# CONEXÃO COM O BANCO
conn = conectar()

anos_df = pd.read_sql(
    "SELECT DISTINCT YEAR(Meses) AS Ano FROM INAD_90 ORDER BY Ano DESC",
    conn
)
ano = st.sidebar.selectbox("Ano", anos_df["Ano"])

mes = st.sidebar.selectbox(
    "Mês",
    list(meses_pt.keys()),
    format_func=lambda x: meses_pt[x]
)

# QUERY – RECUPERAÇÃO APN + PREJUÍZO POR PA
query = """
SELECT
    PA,
    SUM(Recupera_o_Prejuizo_APN) AS Recuperacao_APN,
    SUM(Prejuizo_por_PA) AS Prejuizo_PA
FROM INAD_90
WHERE YEAR(Meses) = %s
  AND MONTH(Meses) = %s
  AND PA IN (0,3,4,5,6,7,8,9,10,11,12,13,14,97)
GROUP BY PA
"""

df = pd.read_sql(query, conn, params=(ano, mes))
conn.close()

df["PA"] = df["PA"].astype(int)

pa_base = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 97]

df_final = (
    pd.DataFrame({"PA": pa_base})
    .merge(df, on="PA", how="left")
    .fillna(0)
)

# CÁLCULO DO % RECUPERAÇÃO PREJUÍZO
df_final["% Recuperação Prejuízo"] = df_final.apply(
    lambda x: x["Recuperacao_APN"] / x["Prejuizo_PA"]
    if x["Prejuizo_PA"] > 0 else 0,
    axis=1
)

# PA como string (eixo categórico)
df_final["PA"] = df_final["PA"].astype(str)

df_valor = df_final.sort_values("Recuperacao_APN", ascending=True)
df_percentual = df_final.sort_values("% Recuperação Prejuízo", ascending=True)

ordem_valor = df_valor["PA"].tolist()
ordem_percentual = df_percentual["PA"].tolist()

def formato_real(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# GRÁFICO 1 – RECUPERAÇÃO APN (R$)
df_valor["APN_plot"] = df_valor["Recuperacao_APN"]
df_valor.loc[df_valor["APN_plot"] <= 0, "APN_plot"] = 10

fig_valor = px.bar(
    df_valor,
    y="PA",
    x="APN_plot",
    orientation="h",
    text="Recuperacao_APN",
    title=f"Recuperação de Prejuízo (APN) – {meses_pt[mes]}/{ano}",
    color_discrete_sequence=["#00AE9D"]
)

fig_valor.update_traces(
    texttemplate="R$ %{text:,.2f}",
    textposition="outside"
)

fig_valor.update_layout(
    xaxis=dict(
        type="log",
        title="Valor Recuperado (R$)",
        tickvals=[10, 100, 1000, 10000, 100000, 1000000],
        ticktext=[
            "R$ 10", "R$ 100", "R$ 1.000",
            "R$ 10.000", "R$ 100.000", "R$ 1.000.000"
        ]
    ),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=ordem_valor,
        title="PA"
    ),
    height=800
)

st.plotly_chart(fig_valor, use_container_width=True)

# GRÁFICO 2 – % RECUPERAÇÃO PREJUÍZO
fig_percentual = px.bar(
    df_percentual,
    y="PA",
    x="% Recuperação Prejuízo",
    orientation="h",
    text="% Recuperação Prejuízo",
    title=f"% Recuperação de Prejuízo (APN) – {meses_pt[mes]}/{ano}",
    color_discrete_sequence=["#00AE9D"]
)

fig_percentual.update_traces(
    texttemplate="%{text:.2%}",
    textposition="outside"
)

fig_percentual.update_layout(
    xaxis=dict(
        title="% Recuperação",
        tickformat=".0%"
    ),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=ordem_percentual,
        title="PA"
    ),
    height=800
)

st.plotly_chart(fig_percentual, use_container_width=True)