import pandas as pd
import streamlit as st
import plotly.graph_objects as go
from pathlib import Path
from main import get_user_info

get_user_info()

st.set_page_config(
    page_title="IEO, Receitas e Custos por PA",
    layout="wide"
)

# Paleta padrão
COLORS = {
    "receitas": "#00AE9D",
    "custos": "#003641",
    "ieo": "#7DB61C"
}

# 📂 LEITURA DO ARQUIVO
BASE_DIR = Path(__file__).resolve().parent

arquivo_excel = (
    BASE_DIR.parent.parent  # sobe até C:\CoopSystem
    / "Arquivos"
    / "IEO por PA.xlsx"
)

# Verificação de existência
if not arquivo_excel.exists():
    st.error(f"❌ Arquivo não encontrado:\n{arquivo_excel}")
    st.stop()

df = pd.read_excel(arquivo_excel)

# 🧹 TRATAMENTO DOS DADOS
df.columns = [
    "ano_mes",
    "numero_central",
    "numero_cooperativa",
    "pa",
    "custos",
    "receitas",
    "ieo"
]

df["ano_mes"] = pd.to_datetime(df["ano_mes"], format="%Y-%m")
df["pa"] = df["pa"].astype(int)
df["custos"] = pd.to_numeric(df["custos"], errors="coerce")
df["receitas"] = pd.to_numeric(df["receitas"], errors="coerce")
df["ieo"] = pd.to_numeric(df["ieo"], errors="coerce")

# 🎛️ FILTRO
st.sidebar.title("Filtro")

pa_selecionado = st.sidebar.selectbox(
    "Selecione o PA",
    sorted(df["pa"].unique())
)

df_pa = df[df["pa"] == pa_selecionado].copy()

df_plot = (
    df_pa
    .groupby("ano_mes", as_index=False)
    .agg({
        "receitas": "sum",
        "custos": "sum",
        "ieo": "mean"
    })
    .sort_values("ano_mes")
)

# 📊 GRÁFICO
st.title("IEO e Receitas, Custos para Ano-Mês Movimento")

fig = go.Figure()

# Receitas
fig.add_bar(
    x=df_plot["ano_mes"],
    y=df_plot["receitas"],
    name="Receitas",
    marker_color=COLORS["receitas"],
    text=[f"R$ {v/1e6:.1f} mi" for v in df_plot["receitas"]],
    textposition="outside"
)

# Custos
fig.add_bar(
    x=df_plot["ano_mes"],
    y=df_plot["custos"],
    name="Custos",
    marker_color=COLORS["custos"],
    text=[f"R$ {v/1e6:.1f} mi" for v in df_plot["custos"]],
    textposition="outside"
)

# IEO
fig.add_scatter(
    x=df_plot["ano_mes"],
    y=df_plot["ieo"],
    name="IEO",
    mode="lines+markers+text",
    text=[f"{v:.2%}" for v in df_plot["ieo"]],
    textposition="top center",
    line=dict(color=COLORS["ieo"], width=3),
    yaxis="y2"
)

# Layout
fig.update_layout(
    barmode="relative",
    template="plotly_dark",
    legend=dict(orientation="h", y=1.15),
    xaxis=dict(
        title="Ano-Mês Movimento",
        tickformat="%b %Y"
    ),
    yaxis=dict(
        title="Valores (R$)",
        tickprefix="R$ ",
        showgrid=True
    ),
    yaxis2=dict(
        title="IEO (%)",
        overlaying="y",
        side="right",
        tickformat=".0%"
    ),
    height=650
)

st.plotly_chart(fig, use_container_width=True)

# 📋 TABELA
st.subheader("📋 Detalhamento por Mês")

df_tabela = df_plot.copy()
df_tabela["Mês/Ano"] = df_tabela["ano_mes"].dt.strftime("%m/%Y")
df_tabela["Receita"] = df_tabela["receitas"].map(lambda x: f"R$ {x:,.2f}")
df_tabela["Custo"] = df_tabela["custos"].map(lambda x: f"R$ {x:,.2f}")
df_tabela["IEO"] = df_tabela["ieo"].map(lambda x: f"{x:.2%}")

df_tabela = df_tabela[["Mês/Ano", "Receita", "Custo", "IEO"]]

st.dataframe(
    df_tabela,
    use_container_width=True,
    hide_index=True
)
