import pandas as pd
import streamlit as st
import plotly.express as px
from db.connection import conectar

st.set_page_config(
    layout="wide",
    page_title="INAD 90 – Mês Atual x Mês Anterior",
    page_icon="logo.png"
)

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

meses_df = pd.read_sql(
    """
    SELECT DISTINCT MONTH(Meses) AS Mes
    FROM INAD_90
    WHERE YEAR(Meses) = %s
    ORDER BY Mes
    """,
    conn,
    params=(ano,)
)

mes_ref = st.sidebar.selectbox(
    "Mês de Referência",
    meses_df["Mes"],
    format_func=lambda x: meses_pt[x]
)

# REGRA DE VIRADA DE ANO
if mes_ref == 1:
    mes_anterior = 12
    ano_anterior = ano - 1
else:
    mes_anterior = mes_ref - 1
    ano_anterior = ano

nome_mes_atual = meses_pt[mes_ref]
nome_mes_anterior = meses_pt[mes_anterior]

st.title(f"Ranking INAD 90 – {nome_mes_anterior} x {nome_mes_atual}")

pa_base = [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 97]

# QUERY – MÊS ATUAL
query_atual = """
SELECT
    PA,
    AVG(INAD_90) AS INAD_90_Atual
FROM INAD_90
WHERE YEAR(Meses) = %s
  AND MONTH(Meses) = %s
  AND PA IN (0,3,4,5,6,7,8,9,10,11,12,13,14,97)
GROUP BY PA
"""

df_atual = pd.read_sql(query_atual, conn, params=(ano, mes_ref))

# QUERY – MÊS ANTERIOR
query_anterior = """
SELECT
    PA,
    AVG(INAD_90) AS INAD_90_Anterior
FROM INAD_90
WHERE YEAR(Meses) = %s
  AND MONTH(Meses) = %s
  AND PA IN (0,3,4,5,6,7,8,9,10,11,12,13,14,97)
GROUP BY PA
"""

df_anterior = pd.read_sql(
    query_anterior,
    conn,
    params=(ano_anterior, mes_anterior)
)

conn.close()

df_atual["PA"] = df_atual["PA"].astype(int)
df_anterior["PA"] = df_anterior["PA"].astype(int)

df_final = (
    pd.DataFrame({"PA": pa_base})
    .merge(df_atual, on="PA", how="left")
    .merge(df_anterior, on="PA", how="left")
    .fillna(0)
)

# VARIAÇÃO %
df_final["Variação %"] = df_final.apply(
    lambda x: (x["INAD_90_Atual"] / x["INAD_90_Anterior"] - 1)
    if x["INAD_90_Anterior"] > 0 else 0,
    axis=1
)

# PA COMO STRING (EIXO CATEGÓRICO)
df_final["PA"] = df_final["PA"].astype(str)

df_tabela = df_final.sort_values("Variação %", ascending=True)

def formato_real(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

def formato_percentual(v):
    return f"{v:.2f}%".replace(".", ",")

tabela_df = pd.DataFrame({
    "PA": df_tabela["PA"],
    f"INAD 90 – {nome_mes_anterior}": df_tabela["INAD_90_Anterior"].apply(formato_real),
    f"INAD 90 – {nome_mes_atual}": df_tabela["INAD_90_Atual"].apply(formato_real),
    f"Variação {nome_mes_anterior} x {nome_mes_atual}":
        (df_tabela["Variação %"] * 100).apply(formato_percentual)
})

col1, col2 = st.columns([1, 1])
altura = (len(tabela_df) + 1) * 35

# COLUNA 1 – TABELA
with col1:
    styled_df = (
        tabela_df
        .style
        .set_properties(**{"text-align": "center"})
        .set_table_styles([
            {"selector": "th", "props": [("text-align", "center")]}
        ])
    )

    st.dataframe(
        styled_df,
        use_container_width=True,
        hide_index=True,
        height=altura
    )

# COLUNA 2 – GRÁFICO
with col2:
    df_grafico = df_tabela.sort_values("Variação %", ascending=False)

    fig = px.bar(
        df_grafico,
        y="PA",
        x="Variação %",
        orientation="h",
        text="Variação %",
        title="Variação do Mês por PA",
        color_discrete_sequence=["#00AE9D"]
    )

    fig.update_traces(
        texttemplate="%{text:.2%}",
        textposition="outside"
    )

    fig.update_layout(
        xaxis=dict(
            title="Variação (%)",
            tickformat=".0%"
        ),
        yaxis=dict(
            type="category",
            categoryorder="array",
            categoryarray=df_grafico["PA"].tolist(),
            title="PA"
        ),
        height=altura,
        bargap=0.20
    )

    st.plotly_chart(fig, use_container_width=True)
