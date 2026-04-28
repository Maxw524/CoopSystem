import streamlit as st
import pandas as pd
from datetime import date
from db.connection import conectar

st.set_page_config(
    layout="wide",
    page_title="INAD 90 – Gestão de Lançamentos",
    page_icon="logo.png"
)

st.title("📊 INAD 90 – Gestão de Lançamentos")

# ✅ MENSAGEM DE SUCESSO (APÓS RERUN)
if "msg_sucesso" in st.session_state:
    st.success(st.session_state.msg_sucesso)
    del st.session_state.msg_sucesso

# MESES
meses_pt = {
    1: "Janeiro", 2: "Fevereiro", 3: "Março", 4: "Abril",
    5: "Maio", 6: "Junho", 7: "Julho", 8: "Agosto",
    9: "Setembro", 10: "Outubro", 11: "Novembro", 12: "Dezembro"
}
# SIDEBAR – FILTROS
st.sidebar.title("🔍 Filtros")

pa_filtro = st.sidebar.selectbox(
    "PA",
    ["Todos","00","03","04","05","06","07","08","09","10","11","12","13","14","97"]
)

ano_filtro = st.sidebar.selectbox(
    "Ano",
    ["Todos"] + list(range(date.today().year - 3, date.today().year + 1))
)

mes_filtro = st.sidebar.selectbox(
    "Mês",
    ["Todos"] + list(meses_pt.keys()),
    format_func=lambda x: "Todos" if x == "Todos" else meses_pt[x]
)

# FUNÇÃO – BUSCAR DADOS
def buscar_dados(pa, ano, mes):
    con = conectar()

    sql = """
        SELECT
            Meses,
            PA,
            INAD_90,
            Recupera_o_Prejuizo_APN,
            Recupera_o_de_Prejuizo_1_ao_15_dias,
            Recupera_o_de_Prejuizo_16_ao_30_dias,
            Prejuizo_por_PA
        FROM INAD_90
        WHERE 1=1
    """
    params = []

    if pa != "Todos":
        sql += " AND PA = %s"
        params.append(pa)

    if ano != "Todos":
        sql += " AND YEAR(Meses) = %s"
        params.append(ano)

    if mes != "Todos":
        sql += " AND MONTH(Meses) = %s"
        params.append(mes)

    df = pd.read_sql(sql, con, params=params)
    con.close()
    return df

# ➕ NOVO LANÇAMENTO (LINHA FIXA EM CIMA)
st.subheader("➕ Novo Lançamento")

with st.form("form_novo_lancamento"):
    c1, c2, c3 = st.columns(3)

    with c1:
        novo_mes = st.date_input("Mês/Ano", value=date.today().replace(day=1))
        novo_pa = st.selectbox(
            "PA",
            ["","00","03","04","05","06","07","08","09","10","11","12","13","14","97"]
        )

    with c2:
        novo_inad = st.number_input("INAD 90 (R$)", min_value=0.0, format="%.2f")
        novo_prejuizo = st.number_input("Prejuízo por PA (R$)", min_value=0.0, format="%.2f")

    with c3:
        novo_apn = st.number_input("Rec. APN (R$)", min_value=0.0, format="%.2f")
        novo_1_15 = st.number_input("Rec. 1–15 dias (R$)", min_value=0.0, format="%.2f")
        novo_16_30 = st.number_input("Rec. 16–30 dias (R$)", min_value=0.0, format="%.2f")

    cadastrar = st.form_submit_button("✅ Cadastrar Lançamento")

if cadastrar:
    if not novo_pa:
        st.warning("⚠️ Informe o PA para cadastrar.")
    else:
        try:
            con = conectar()
            cur = con.cursor()

            sql = """
                INSERT INTO INAD_90 (
                    Meses,
                    PA,
                    INAD_90,
                    Recupera_o_Prejuizo_APN,
                    Recupera_o_de_Prejuizo_1_ao_15_dias,
                    Recupera_o_de_Prejuizo_16_ao_30_dias,
                    Prejuizo_por_PA
                )
                VALUES (%s,%s,%s,%s,%s,%s,%s)
                ON DUPLICATE KEY UPDATE
                    INAD_90 = VALUES(INAD_90),
                    Recupera_o_Prejuizo_APN = VALUES(Recupera_o_Prejuizo_APN),
                    Recupera_o_de_Prejuizo_1_ao_15_dias = VALUES(Recupera_o_de_Prejuizo_1_ao_15_dias),
                    Recupera_o_de_Prejuizo_16_ao_30_dias = VALUES(Recupera_o_de_Prejuizo_16_ao_30_dias),
                    Prejuizo_por_PA = VALUES(Prejuizo_por_PA)
            """

            cur.execute(sql, (
                novo_mes.replace(day=1),
                novo_pa,
                novo_inad,
                novo_apn,
                novo_1_15,
                novo_16_30,
                novo_prejuizo
            ))

            con.commit()
            cur.close()
            con.close()

            st.session_state.msg_sucesso = (
                f"✅ Lançamento cadastrado com sucesso!\n\n"
                f"📅 Mês/Ano: {novo_mes.strftime('%m/%Y')}\n"
                f"🏢 PA: {novo_pa}"
            )

            st.rerun()

        except Exception as e:
            st.error(f"❌ Erro ao cadastrar lançamento: {e}")

# ✏️ TABELA PARA EDIÇÃO (EMBAIXO)
st.divider()
st.subheader("✏️ Lançamentos Cadastrados")

df = buscar_dados(pa_filtro, ano_filtro, mes_filtro)

df_editado = st.data_editor(
    df,
    use_container_width=True,
    num_rows="fixed",
    hide_index=True,
    column_config={
        "Meses": st.column_config.DateColumn("Mês/Ano"),
        "PA": st.column_config.TextColumn("PA"),
        "INAD_90": st.column_config.NumberColumn("INAD 90 (R$)", format="%.2f"),
        "Recupera_o_Prejuizo_APN": st.column_config.NumberColumn("Rec. APN (R$)", format="%.2f"),
        "Recupera_o_de_Prejuizo_1_ao_15_dias": st.column_config.NumberColumn("Rec. 1–15 dias (R$)", format="%.2f"),
        "Recupera_o_de_Prejuizo_16_ao_30_dias": st.column_config.NumberColumn("Rec. 16–30 dias (R$)", format="%.2f"),
        "Prejuizo_por_PA": st.column_config.NumberColumn("Prejuízo por PA (R$)", format="%.2f"),
    }
)

if st.button("💾 Salvar Alterações da Tabela"):
    try:
        con = conectar()
        cur = con.cursor()

        sql = """
            UPDATE INAD_90
            SET
                INAD_90 = %s,
                Recupera_o_Prejuizo_APN = %s,
                Recupera_o_de_Prejuizo_1_ao_15_dias = %s,
                Recupera_o_de_Prejuizo_16_ao_30_dias = %s,
                Prejuizo_por_PA = %s
            WHERE Meses = %s AND PA = %s
        """

        for _, row in df_editado.iterrows():
            cur.execute(sql, (
                row["INAD_90"],
                row["Recupera_o_Prejuizo_APN"],
                row["Recupera_o_de_Prejuizo_1_ao_15_dias"],
                row["Recupera_o_de_Prejuizo_16_ao_30_dias"],
                row["Prejuizo_por_PA"],
                row["Meses"],
                row["PA"]
            ))

        con.commit()
        cur.close()
        con.close()

        st.success("✅ Alterações salvas com sucesso!")

    except Exception as e:
        st.error(f"❌ Erro ao salvar alterações: {e}")