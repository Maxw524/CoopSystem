import pandas as pd
import streamlit as st
import plotly.express as px
from db.connection import conectar

st.set_page_config(
    layout="wide",
    page_title="Recuperação de Prejuízo – Quinzenal",
    page_icon="logo.png"
)

st.title("Recuperação de Prejuízo – Quinzenal")

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

# QUERY – RECUPERAÇÃO DE PREJUÍZO POR PA
query = """
SELECT
    PA,
    SUM(Recupera_o_de_Prejuizo_1_ao_15_dias) AS rec_1_15,
    SUM(Recupera_o_de_Prejuizo_16_ao_30_dias) AS rec_16_30
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

# PA como string para gráficos
df_final["PA"] = df_final["PA"].astype(str)

# FILTRO DE PA
pa_opcoes = ["Todos"] + df_final["PA"].tolist()
pa_selecionado = st.sidebar.multiselect("PA", pa_opcoes, default=["Todos"])

if "Todos" in pa_selecionado or not pa_selecionado:
    df_cards = df_final.copy()
    texto_pa = "Todos"
else:
    df_cards = df_final[df_final["PA"].isin(pa_selecionado)]
    texto_pa = ", ".join(sorted(pa_selecionado, key=int))

st.subheader(f"PAs selecionados: {texto_pa}")

# CARDS
def formato_real(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

total_1_15 = df_cards["rec_1_15"].sum()
total_16_30 = df_cards["rec_16_30"].sum()
total_geral = total_1_15 + total_16_30

col1, col2, col3 = st.columns(3)
col1.metric("1 a 15 dias", formato_real(total_1_15))
col2.metric("16 a 30 dias", formato_real(total_16_30))
col3.metric("Total", formato_real(total_geral))

# Preparação para o Grafico
df_cards["PA"] = df_cards["PA"].astype(str)

df_melt = df_cards.melt(
    id_vars="PA",
    value_vars=["rec_1_15", "rec_16_30"],
    var_name="Período",
    value_name="Valor"
)

df_melt["Período"] = df_melt["Período"].map({
    "rec_1_15": "1 a 15 dias",
    "rec_16_30": "16 a 30 dias"
})

df_total = df_cards.copy()
df_total["Total"] = df_total["rec_1_15"] + df_total["rec_16_30"]
ordem_pa = df_total.sort_values("Total", ascending=True)["PA"].tolist()

# Escala log não aceita zero
df_melt["Valor_plot"] = df_melt["Valor"].where(df_melt["Valor"] > 0, 10)

# GRÁFICO
fig = px.bar(
    df_melt,
    y="PA",
    x="Valor_plot",
    color="Período",
    orientation="h",
    barmode="group",
    title=f"Recuperação de Prejuízo – {meses_pt[mes]}/{ano}",
    text="Valor",
    color_discrete_sequence=["#00AE9D", "#003F5C"]
)

fig.update_traces(
    texttemplate="R$ %{text:,.2f}",
    textposition="outside"
)

fig.update_layout(
    xaxis=dict(
        type="log",
        title="Valor (R$)",
        tickvals=[10, 100, 1000, 10000, 100000],
        ticktext=[
            "R$ 10", "R$ 100", "R$ 1.000",
            "R$ 10.000", "R$ 100.000"
        ]
    ),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=ordem_pa,
        title="PA"
    ),
    height=800
)

st.plotly_chart(fig, use_container_width=True)