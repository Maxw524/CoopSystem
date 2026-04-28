import pandas as pd
import streamlit as st
import plotly.express as px
from db.connection import conectar

st.set_page_config(
    layout="wide",
    page_title="Ranking INAD 90",
    page_icon="logo.png"
)

st.title("Ranking INAD 90")

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

# QUERY – INAD E RECUPERAÇÃO POR PA NO MÊS
query = """
SELECT
    PA,
    SUM(INAD_90) AS INAD_90,
    SUM(Recupera_o_Prejuizo_APN) AS Recuperacao_APN
FROM INAD_90
WHERE YEAR(Meses) = %s
  AND MONTH(Meses) = %s
  AND PA IN (0,3,4,5,6,7,8,9,10,11,12,13,14,97)
GROUP BY PA
"""

df = pd.read_sql(query, conn, params=(ano, mes))
conn.close()

df["PA"] = df["PA"].astype(int)

pa_base = [0,3,4,5,6,7,8,9,10,11,12,13,14,97]

df_final = (
    pd.DataFrame({"PA": pa_base})
    .merge(df, on="PA", how="left")
    .fillna(0)
)

total_inad_mes = df_final["INAD_90"].sum()

if total_inad_mes > 0:
    df_final["% INAD 90"] = df_final["INAD_90"] / total_inad_mes
else:
    df_final["% INAD 90"] = 0

df_final["% Recuperação Prejuízo"] = df_final.apply(
    lambda x: x["Recuperacao_APN"] / x["INAD_90"]
    if x["INAD_90"] > 0 else 0,
    axis=1
)

# PA como string (eixo categórico)
df_final["PA"] = df_final["PA"].astype(str)

# ORDENAÇÕES
df_valor = df_final.sort_values("INAD_90", ascending=False)
df_percentual = df_final.sort_values("% INAD 90", ascending=False)

# FORMATAÇÃO
def formato_real(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# GRÁFICO 1 – INAD 90 (R$)
df_valor["INAD_plot"] = df_valor["INAD_90"]
df_valor.loc[df_valor["INAD_plot"] <= 0, "INAD_plot"] = 10

fig_valor = px.bar(
    df_valor,
    y="PA",
    x="INAD_plot",
    orientation="h",
    text="INAD_90",
    title=f"INAD 90 por PA – {meses_pt[mes]}/{ano}",
    color_discrete_sequence=["#00AE9D"]
)

fig_valor.update_traces(
    texttemplate="R$ %{text:,.2f}",
    textposition="outside"
)

fig_valor.update_layout(
    xaxis=dict(
        type="log",
        title="Valor (R$)",
        tickvals=[10, 100, 1000, 10000, 100000, 1000000],
        ticktext=[
            "R$ 10","R$ 100","R$ 1.000",
            "R$ 10.000","R$ 100.000","R$ 1.000.000"
        ]
    ),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=df_valor["PA"].tolist(),
        title="PA"
    ),
    height=800
)

st.plotly_chart(fig_valor, use_container_width=True)

# GRÁFICO 2 – % INAD 90
fig_percentual = px.bar(
    df_percentual,
    y="PA",
    x="% INAD 90",
    orientation="h",
    text="% INAD 90",
    title=f"% INAD 90 por PA – {meses_pt[mes]}/{ano}",
    color_discrete_sequence=["#00AE9D"]
)

fig_percentual.update_traces(
    texttemplate="%{text:.2%}",
    textposition="outside"
)

fig_percentual.update_layout(
    xaxis=dict(
        title="% INAD 90",
        tickformat=".0%"
    ),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=df_percentual["PA"].tolist(),
        title="PA"
    ),
    height=800
)

st.plotly_chart(fig_percentual, use_container_width=True)