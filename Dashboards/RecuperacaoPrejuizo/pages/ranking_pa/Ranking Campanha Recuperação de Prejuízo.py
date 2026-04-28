import pandas as pd
import streamlit as st
import plotly.express as px
from db.connection import conectar
from pathlib import Path

st.set_page_config(
    layout="wide",
    page_title="Ranking Campanha de Recuperação de Prejuízo",
    page_icon="logo.png"
)

st.title("Ranking Campanha de Recuperação de Prejuízo")

# CAMINHO E NOME DO EXCEL
base_path = Path(
    r"C:\CoopSystem\Dashboards\RecuperacaoPrejuizo\doc"
)
base_path.mkdir(parents=True, exist_ok=True)

excel_path = base_path / "Planilha de evidências  Para o conselho.xlsx"

# UPLOAD DA PLANILHA
st.subheader("📤 Atualização da Planilha da Campanha de Recuperação")

uploaded_file = st.file_uploader(
    "Envie um novo Excel para atualizar a base",
    type=["xlsx"]
)

if uploaded_file:
    with open(excel_path, "wb") as f:
        f.write(uploaded_file.getbuffer())
    st.success("✅ Planilha atualizada com sucesso!")

# LEITURA DO EXCEL
if not excel_path.exists():
    st.error("❌ A planilha não foi encontrada. Faça o upload inicial.")
    st.stop()

df_excel = pd.read_excel(excel_path)

# MAPEAMENTO FIXO DAS COLUNAS
# C → PA | G → Valor | I → Data
df_rec = pd.DataFrame({
    "PA": df_excel.iloc[:, 2],
    "Valor_Recuperado": df_excel.iloc[:, 6],
    "Data_Recuperacao": df_excel.iloc[:, 8]
})

df_rec["Data_Recuperacao"] = pd.to_datetime(df_rec["Data_Recuperacao"])
df_rec["PA"] = df_rec["PA"].astype(int)
df_rec["Ano"] = df_rec["Data_Recuperacao"].dt.year
df_rec["Mes"] = df_rec["Data_Recuperacao"].dt.month

meses_pt = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
}

ano = st.sidebar.selectbox(
    "Ano",
    sorted(df_rec["Ano"].unique(), reverse=True)
)

mes = st.sidebar.selectbox(
    "Mês",
    list(meses_pt.keys()),
    format_func=lambda x: meses_pt[x]
)

# RECUPERAÇÃO (EXCEL)
df_rec_mes = (
    df_rec[
        (df_rec["Ano"] == ano) &
        (df_rec["Mes"] == mes)
    ]
    .groupby("PA", as_index=False)["Valor_Recuperado"]
    .sum()
)

# PREJUÍZO (BANCO)
conn = conectar()

query = """
SELECT
    PA,
    SUM(Prejuizo_por_PA) AS Prejuizo_PA
FROM INAD_90
WHERE YEAR(Meses) = %s
  AND MONTH(Meses) = %s
GROUP BY PA
"""

df_prej = pd.read_sql(query, conn, params=(ano, mes))
conn.close()

df_prej["PA"] = df_prej["PA"].astype(int)

pa_base = [0,3,4,5,6,7,8,9,10,11,12,13,14,97]

df_final = (
    pd.DataFrame({"PA": pa_base})
    .merge(df_rec_mes, on="PA", how="left")
    .merge(df_prej, on="PA", how="left")
    .fillna(0)
)

df_final["% Recuperacao"] = df_final.apply(
    lambda x: x["Valor_Recuperado"] / x["Prejuizo_PA"]
    if x["Prejuizo_PA"] > 0 else 0,
    axis=1
)

df_final["PA"] = df_final["PA"].astype(str)

df_pct = df_final.sort_values("% Recuperacao", ascending=False)
df_val = df_final.sort_values("Valor_Recuperado", ascending=False)

def formato_real(v):
    return f"R$ {v:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

# GRÁFICO 1 – % RECUPERAÇÃO
fig_pct = px.bar(
    df_pct,
    y="PA",
    x="% Recuperacao",
    orientation="h",
    text="% Recuperacao",
    title=f"Ranking % Recuperação – {meses_pt[mes]}/{ano}",
    color_discrete_sequence=["#00AE9D"]
)

fig_pct.update_traces(texttemplate="%{text:.2%}", textposition="outside")

fig_pct.update_layout(
    xaxis=dict(title="% Recuperação", tickformat=".0%"),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=df_pct["PA"].tolist()[::-1],  # 🔥 INVERSÃO
        title="PA"
    ),
    height=500
)

st.plotly_chart(fig_pct, use_container_width=True)

# GRÁFICO 2 – VALOR RECUPERADO
fig_val = px.bar(
    df_val,
    y="PA",
    x="Valor_Recuperado",
    orientation="h",
    text="Valor_Recuperado",
    title=f"Ranking Valor Recuperado – {meses_pt[mes]}/{ano}",
    color_discrete_sequence=["#003F5C"]
)

fig_val.update_traces(texttemplate="R$ %{text:,.2f}", textposition="outside")

fig_val.update_layout(
    xaxis=dict(title="Valor Recuperado (R$)"),
    yaxis=dict(
        type="category",
        categoryorder="array",
        categoryarray=df_val["PA"].tolist()[::-1],  # 🔥 INVERSÃO
        title="PA"
    ),
    height=500
)

st.plotly_chart(fig_val, use_container_width=True)

# TABELA
st.subheader("📋 Detalhamento por PA")

tabela = pd.DataFrame({
    "PA": df_val["PA"],
    "Valor Recuperado": df_val["Valor_Recuperado"].apply(formato_real),
    "Prejuízo": df_val["Prejuizo_PA"].apply(formato_real),
    "% Recuperação": df_val["% Recuperacao"].apply(lambda x: f"{x:.2%}")
})

st.dataframe(tabela, use_container_width=True, hide_index=True)
