import { useState, useMemo, useEffect } from "react";

import { calcularTaxaPolitica } from "../rules/repactuacaoRules";

import { verificarRegrasCampanha, isContratoPrejuizo } from "../utils/taxasCampanha";

import jsPDF from "jspdf";

import autoTable from "jspdf-autotable";

import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";



export default function SimulacaoNegociacao() {

  const { state } = useLocation();

  const navigate = useNavigate();

  const { user, logout } = useAuth();



  // 1) Dados vindos da tela de renegociacao

  const { cpf, contratos = [], todosContratos = [] } = state || {};

  const nomeCliente = state?.nomeCliente || "";



  // 2) Calcula saldo total dos contratos (sem adicionais)

  const totalContratos = useMemo(() => {

    return contratos.reduce(

      (sum, c) =>

        sum +

        (Number(

          c?.totalDevido ??

            c?.saldoBase ??

            c?.valorSaldoContabilBruto ??

            0

        ) || 0),

      0

    );

  }, [contratos]);



  function voltar() {

    navigate("/renegociacao", {

      state: {

        cpf,

        nomeCliente,

        contratos: todosContratos, // Passa todos os contratos, nao apenas os selecionados

        cpfPreSelecionado: cpf, // Adiciona CPF pre-selecionado

      },

    });

  }



  function voltarLimpo() {

    navigate("/renegociacao", {

      state: {

        cpf: "",

        nomeCliente: "",

        contratos: [],

      },

    });

  }



  // ===============================

  // ESTADOS DA SIMULACAO

  // ===============================

  const [entradaPercentual, setEntradaPercentual] = useState(10);

  const [entradaValorInput, setEntradaValorInput] = useState("");



  const [prazo, setPrazo] = useState(24);

  const [prazoInput, setPrazoInput] = useState("24");



  const [idade, setIdade] = useState("70");



  const [adicionarGarantiaReal, setAdicionarGarantiaReal] = useState(false);

  const [valorGarantia, setValorGarantia] = useState("");



  // Ativa campanha automaticamente ao marcar garantia real (so se ja estiver ativa)

  const handleGarantiaRealChange = (checked) => {

    setAdicionarGarantiaReal(checked);

    if (checked && campanhaAplicadaSistema) {

      setCampanhaAtivaManualmente(true);

    }

  };



  const [temAvalista, setTemAvalista] = useState(false);

  const [avalEhSocio, setAvalEhSocio] = useState(false);

  const [dadosAvalista, setDadosAvalista] = useState("");

  // Funcao para marcar/desmarcar avalista

  const handleAvalistaChange = (checked) => {

    setTemAvalista(checked);

    if (checked) {

      setAvalEhSocio(false); // Garante que nao seja socio ao marcar

      setDadosAvalista(""); // Limpa o campo de dados

    } else {

      setAvalEhSocio(false); // Reseta ao desmarcar

      setDadosAvalista(""); // Limpa o campo de dados

    }

  };



  const [criterioAtraso, setCriterioAtraso] = useState("todos");



  const [troco, setTroco] = useState("");

  const [acrescimos, setAcrescimos] = useState("");



  const [mostrarDebug, setMostrarDebug] = useState(false);



  // ðŸ‘‡ NOVOS ESTADOS E CALCULOS RELACIONADOS Ã€ CAMPANHA / DIAS DE ATRASO

  const [campanhaAtivaManualmente, setCampanhaAtivaManualmente] = useState(false);



  // Verificar regras de campanha (prejuizo vs normal)

  const regrasCampanha = useMemo(() => {

    return verificarRegrasCampanha(contratos);

  }, [contratos]);



  // Verificar se ha contratos de prejuizo

  const contratosPrejuizo = useMemo(() => {

    return contratos.filter(isContratoPrejuizo);

  }, [contratos]);



  const {

    possuiContratosMenos90,

    possuiContratosMaisOuIgual90,

    todosContratosMenos90,

  } = useMemo(() => {

    let menos90 = false;

    let maisOuIgual90 = false;

    let todosMenos90 = true;



    for (const c of contratos) {

      // Ajuste aqui se o nome do campo de dias de atraso for diferente

      const dias = Number(

        c?.diasAtraso ?? c?.qtdeDiasAtraso ?? c?.diasEmAtraso ?? 0

      );



      if (!Number.isFinite(dias)) continue;



      if (dias < 90) {

        menos90 = true;

      } else {

        maisOuIgual90 = true;

        todosMenos90 = false; // Se encontrar algum >= 90, quebra a flag

      }

    }



    return {

      possuiContratosMenos90: menos90,

      possuiContratosMaisOuIgual90: maisOuIgual90,

      todosContratosMenos90: todosMenos90,

    };

  }, [contratos]);



  const misturaContratosAtraso =

    possuiContratosMenos90 && possuiContratosMaisOuIgual90;



  useEffect(() => {

    // Sempre que trocar CPF ou lista de contratos, zera a campanha manual

    setCampanhaAtivaManualmente(false);

  }, [cpf, contratos]);



  // ===============================

  // PARSERS

  // ===============================

  function parseBRL(value) {

    if (!value) return 0;

    let v = value.toString();

    v = v.replace(/[^\d.,]/g, "");

    if (v.includes(",") && v.includes(".")) {

      v = v.replace(/\./g, "").replace(",", ".");

    } else if (v.includes(",")) {

      v = v.replace(",", ".");

    }

    return Number(v) || 0;

  }



  function parseMoneyBR(value) {

    if (!value) return 0;

    let v = value.toString().replace(/[^\d.,]/g, "");

    if (v.includes(",") && v.includes(".")) {

      return Number(v.replace(/\./g, "").replace(",", ".")) || 0;

    }

    if (v.includes(",")) {

      return Number(v.replace(",", ".")) || 0;

    }

    if (v.includes(".")) {

      return Number(v) || 0;

    }

    return Number(v) || 0;

  }



  const trocoValor = parseMoneyBR(troco);

  const acrescimosValor = parseMoneyBR(acrescimos);

  const totalAdicionais = trocoValor + acrescimosValor;



  // 3) Calcula saldo total (incluindo valores adicionais)

  const totalRecalculado = totalContratos + totalAdicionais;



  // ===============================

  // MOTOR DE REGRAS

  // ===============================

  const resultado = useMemo(() => {

    if (contratos.length === 0) return null;



    const entradaClamped = Math.min(

      100,

      Math.max(0, Number(entradaPercentual) || 0)

    );

    const prazoClamped = Math.min(

      60,

      Math.max(6, Number(prazo) || 6)

    );



    return calcularTaxaPolitica({

      contratos,

      entradaPercentual: entradaClamped,

      prazo: prazoClamped,

      adicionarGarantiaReal,

      temAvalista,

      avalEhSocio,

      criterioAtraso,

      // ðŸ‘‡ NOVO: informa que a campanha foi ativada manualmente

      forcarCampanha: campanhaAtivaManualmente,

    });



  },

   [

    contratos,

    entradaPercentual,

    prazo,

    adicionarGarantiaReal,

    temAvalista,

    avalEhSocio,

    criterioAtraso,

    totalRecalculado,

    // ðŸ‘‡ NOVO: recalcular sempre que ativar/desativar campanha manualmente

    campanhaAtivaManualmente,

  ]);



  if (!resultado) {

    return (

      <p style={{ padding: 20 }}>Nenhum contrato recebido para simulacao.</p>

    );

  }



  const { taxaFinal, taxaOriginal, taxaPolitica, alertas, debug } = resultado;



  // ===============================

  // TAXA DE SEGURO OBRIGATORIA

  // ===============================

  let taxaSeguroMensal = 0;

  const idadeNum = Number(idade);

  if (Number.isFinite(idadeNum) && idadeNum > 0) {

    taxaSeguroMensal = idadeNum < 65 ? 0.06 : 0.12;

  }



  const taxaComSeguro = (Number(taxaFinal) || 0) + taxaSeguroMensal;



  // ===============================

  // CALCULOS AUXILIARES

  // ===============================

  const fmtBRL = (v) =>

    (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", {

      style: "currency",

      currency: "BRL",

    });



  // >>> ALTERACAO: helper para exibir % com no max. 4 casas, sem arredondar (apenas truncar)

  const formatPercent4 = (p) => {

    const n = Number(p);

    if (!Number.isFinite(n)) return "0";

    const trunc = Math.trunc(n * 10000) / 10000;

    return trunc.toLocaleString("pt-BR", {

      minimumFractionDigits: 0,

      maximumFractionDigits: 4,

    });

  };



  const entradaValor =

    ((totalRecalculado) * (Number(entradaPercentual) || 0)) / 100;



  const saldoBase = Math.max(totalRecalculado - entradaValor, 0);

  const saldoFinanciar = Math.max(saldoBase, 0);



  const i = (Number(taxaComSeguro) || 0) / 100;

  const n = Number(prazo) || 0;

  let parcelaEstimativa = 0;

  if (i > 0 && n > 0) {

    parcelaEstimativa =

      (i * saldoFinanciar) / (1 - Math.pow(1 + i, -n));

  } else if (n > 0) {

    parcelaEstimativa = saldoFinanciar / n;

  }



  // ðŸ‘‡ AJUSTE NAS FLAGS DE CAMPANHA - NOVAS REGRAS

  const campanhaAplicadaSistema =

    taxaPolitica !== null && Number.isFinite(taxaPolitica);

  const elegivel = debug?.elegivelCampanha === true;

  const bloqueioPorTaxaMinima =

    debug?.bloqueioTaxaOrigemMinima === true;



  // Regras de ativacao manual baseadas no tipo de campanha permitida

  const podeAtivarCampanha = regrasCampanha.tipoCampanhaPermitida !== null && 

                            !regrasCampanha.motivoBloqueio &&

                            !todosContratosMenos90; // Bloqueia se todos contratos < 90 dias

  

  // Campanha so esta ativa se foi ativada manualmente (nunca automaticamente)

  const campanhaAtiva = campanhaAtivaManualmente;

  

  // Verificar se e campanha de prejuizo

  const ehCampanhaPrejuizo = regrasCampanha.tipoCampanhaPermitida === 'prejuizo';



  const melhorou =

    Number.isFinite(taxaFinal) &&

    Number.isFinite(taxaOriginal) &&

    taxaFinal < taxaOriginal;



  const prazoTipo = n <= 24 ? "<= 24x (curto)" : "> 24x (longo)";

  const faixaEntrada =

    entradaPercentual >= 30

      ? ">= 30%"

      : entradaPercentual >= 20

      ? "20%-29,99%"

      : entradaPercentual >= 10

      ? "10%-19,99%"

      : "< 10% (sem faixa)";



  // ===============================

  // HANDLERS ESPECIFICOS

  // ===============================

  function handleToggleCampanha() {

    // Se for ativar campanha manualmente

    if (!campanhaAtivaManualmente) {

      if (!podeAtivarCampanha) return;



      let confirmMessage = "";

      if (ehCampanhaPrejuizo) {

        confirmMessage = "Deseja ativar a Campanha de Prejuizo? Esta campanha exige entrada minima de 10%.";

      } else {

        confirmMessage = "Deseja ativar a campanha de desconto de taxa?";

      }



      const ok = window.confirm(confirmMessage);

      if (!ok) return;



      setCampanhaAtivaManualmente(true);

    } else {

      // Desligar campanha manual

      setCampanhaAtivaManualmente(false);

    }

  }



  function handleBlurEntradaValor() {

    const raw = (entradaValorInput ?? "").trim();



    if (raw === "") {

      setEntradaValorInput("");

      return;

    }



    const valor = parseMoneyBR(raw);

    if (!Number.isFinite(valor) || valor < 0) {

      setEntradaValorInput("");

      return;

    }



    const novoPercent =

      totalRecalculado > 0 ? (valor / totalRecalculado) * 100 : 0;

    const clamped = Math.min(100, Math.max(0, novoPercent));



    // >>> ALTERACAO: Remover arredondamento para 2 casas (preservar precisao)

    // const normalized = Math.round(clamped * 100) / 100;

    // setEntradaPercentual(normalized);



    setEntradaPercentual(clamped); // mantem a precisao real

    setEntradaValorInput("");

  }



  // ===============================

  // ESTILOS (injetados no documento)

  // ===============================

  useEffect(() => {

    const id = "simulacao-negociacao-styles";

    const existing = document.getElementById(id);

    if (existing) existing.remove();

    const style = document.createElement("style");

    style.id = id;

    style.innerHTML = `

      .sn-container { 

        --card: var(--surface);

        --muted: var(--color-text-label);

        --text: var(--color-text-main);

        --primary: var(--color-primary);

        --primary-700: var(--color-primary-2);

        --success: #16a34a;

        --warning: #b45309;

        --danger: #dc2626;

        --chip: var(--color-bg-input);

        --divider: var(--color-border-input);

        --shadow: var(--shadow-soft);

        --radius: 12px;

        max-width: 1600px;

        margin: 48px auto;

        padding: 36px;

        color: var(--text); 

        font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; 

      }



      .sn-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 12px; }

      .sn-title { font-size: 22px; font-weight: 700; letter-spacing: .3px; }



      .sn-grid {

        display: grid; 

        grid-template-columns: 1fr; 

        gap: 16px; 

      }



      @media (min-width: 900px) { 

        .sn-grid { 

          grid-template-columns: 3fr 1fr; 

        } 

      }



      .sn-card { background: var(--color-bg-card); border: 1px solid var(--divider); border-radius: var(--radius); box-shadow: var(--shadow); backdrop-filter: blur(10px); padding: 18px 18px 14px; }

      .sn-section + .sn-section { border-top: 1px dashed var(--divider); margin-top: 16px; padding-top: 16px; }

      .sn-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

      .sn-row-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }

      .sn-label { display: block; color: var(--muted); font-size: 12px; margin-bottom: 6px; letter-spacing: .3px; }

      .sn-value { font-size: 18px; font-weight: 700; }

      .sn-chip { display: inline-flex; align-items: center; gap: 8px; background: var(--chip); border: 1px solid var(--divider); padding: 6px 10px; border-radius: 999px; color: var(--text); font-size: 12px; }

      .sn-badge { background: var(--accent-soft, rgba(37,99,235,.16)); color: var(--text); border: 1px solid var(--border-strong); border-radius: 8px; padding: 4px 8px; font-size: 12px; }

      .sn-badge.green { background: rgba(34,197,94,.15); color: #86efac; border-color: rgba(34,197,94,.35); }

      .sn-badge.amber { background: rgba(245,158,11,.15); color: #fcd34d; border-color: rgba(245,158,11,.35); }

      .sn-badge.red   { background: rgba(239,68,68,.15);  color: #fca5a5; border-color: rgba(239,68,68,.35); }

      .sn-strong { font-weight: 700; color: var(--text); }

      .sn-input, .sn-number { background: var(--color-bg-input); border: 1px solid var(--divider); border-radius: 10px; color: var(--text); padding: 8px 10px; outline: none; width: 100%; }

      .sn-number { width: 120px; }

      .sn-slider { width: 100%; accent-color: var(--primary); }

      .sn-switch { display: inline-flex; align-items: center; gap: 10px; cursor: pointer; user-select: none; }

      .sn-switch input { display: none; }

      .sn-switch .track { width: 42px; height: 24px; border-radius: 999px; background: #1f2937; border: 1px solid var(--divider); position: relative; transition: background .2s ease; }

      .sn-switch .thumb { position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: left .2s ease, background .2s ease; }

      .sn-switch input:checked + .track { background: var(--primary); }

      .sn-switch input:checked + .track .thumb { left: 22px; background: #fff; }



      .sn-button { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: 1px solid var(--divider); padding: 10px 14px; border-radius: 10px; background: var(--color-bg-input); color: var(--text); cursor: pointer; }

      .sn-button:active { transform: translateY(1px); }



      .sn-ok { color: #86efac; }

      .sn-warn { color: #fbbf24; }

      .sn-danger { color: #fca5a5; }

      .sn-alert { background: #1b1f2e; border: 1px solid #2b3448; border-left: 4px solid var(--warning); padding: 10px 12px; border-radius: 8px; color: #f1cfa0; }

      .sn-divider { height: 1px; background: var(--divider); margin: 12px 0; }

      .sn-final { font-size: 28px; font-weight: 800; }

      .sn-final.good { color: #86efac; }

      .sn-small { color: var(--muted); font-size: 12px; }



      .rn-title-wrapper { display: flex; align-items: center; gap: 10px; }

      .rn-logo { height: 32px; width: auto; }

    `;

    document.head.appendChild(style);

    return () => {
      style.remove();
    };

  }, []);



  // ===============================

  // GERAR PDF (Simulacao)

  // ===============================

  function gerarPDF() {

    const debugLog = (...args) => {

      try {

        console.log(...args);

      } catch {}

      try {

        const pre = document.createElement("pre");

        pre.style.cssText =

          "position:fixed;bottom:8px;right:8px;max-width:50vw;max-height:40vh;overflow:auto;background:#0b1220;color:#e2e8f0;border:1px solid #334155;padding:8px;border-radius:8px;z-index:99999;font-size:12px;";

        pre.textContent = args

          .map((a) =>

            typeof a === "string" ? a : JSON.stringify(a, null, 2)

          )

          .join(" ");

        document.body.appendChild(pre);

        setTimeout(() => pre.remove(), 8000);

      } catch {}

    };



    try {

      const doc = new jsPDF({ unit: "pt", format: "a4" });

      const pageWidth = doc.internal.pageSize.getWidth();

      const margin = 40;

      let y = margin;



      const clean = (txt) =>

        String(txt ?? "")

          .normalize("NFD")

          .replace(/[\u0300-\u036f]/g, "")

          .replace(/[^\x20-\x7E]/g, "-");



      const safeNumber = (v, d = 0) => {

        const n = Number(v);

        return Number.isFinite(n) ? n : d;

      };

      const safeBRL = (v) => clean(fmtBRL(safeNumber(v, 0)));



      doc.setFillColor(240, 245, 255);

      doc.rect(0, 0, pageWidth, 90, "F");



      doc.setFont("helvetica", "bold");

      doc.setFontSize(22);

      doc.setTextColor(30, 41, 59);

      doc.text(clean("SIMULACAO DE REPACTUACAO"), margin + 110, 45);



      const logoPos = { x: margin, y: 20, w: 90, h: 40 };



      y = 110;

      doc.setFont("helvetica", "normal");

      doc.setFontSize(11);

      doc.setTextColor(60, 60, 60);



      const dataHora = new Date().toLocaleString("pt-BR");

      doc.text(clean(`Data/Hora: ${dataHora}`), margin, y);

      y += 14;

      doc.text(clean(`Cliente: ${nomeCliente || "-"}`), margin, y);

      y += 14;

      doc.text(clean(`CPF/CNPJ: ${cpf || "-"}`), margin, y);

      y += 14;



      doc.setDrawColor(210, 215, 220);

      doc.line(margin, y, pageWidth - margin, y);

      y += 15;



      const avalistaSocioTxt = temAvalista

        ? avalEhSocio

          ? "Sim"

          : "Nao"

        : "";

      const garantiaValorTxt = adicionarGarantiaReal

        ? clean(fmtBRL(valorGarantiaNum))

        : "";



      const linhas = [

        ["Saldo Total para Negociacao", safeBRL(totalRecalculado)],

        // >>> ALTERACAO: % de entrada exibindo 4 casas (truncadas)

        ["% de Entrada", clean(`${formatPercent4(entradaPercentual)}%`)],

        ["Valor de Entrada", safeBRL(entradaValor)],

        ["Prazo (meses)", clean(String(safeNumber(prazo, 0)))],

        ["Troco", safeBRL(trocoValor)],

        ["Acrescimos", safeBRL(acrescimosValor)],

        ["Saldo a Financiar", safeBRL(saldoFinanciar)],

        ["Parcela Estimada", safeBRL(parcelaEstimativa)],

        ["Idade para calculo do seguro", clean(idade || "")],

        [

          "Taxa Seguro (a.m.)",

          taxaSeguroMensal > 0

            ? clean(`${taxaSeguroMensal.toFixed(3)}%`)

            : "",

        ],

        [

          "Taxa Final + Seguro (a.m.)",

          taxaComSeguro > 0

            ? clean(`${taxaComSeguro.toFixed(3)}%`)

            : "",

        ],

        ["Tem Avalista?", clean(temAvalista ? "Sim" : "Nao")],

        ["Avalista e socio?", clean(avalistaSocioTxt)],

        ["Garantia Real nova?", clean(adicionarGarantiaReal ? "Sim" : "Nao")],

        ["Valor da Garantia", garantiaValorTxt],

      ];



      try {

        doc.autoTable({

          startY: y,

          head: [["Campo", "Valor"].map(clean)],

          body: linhas.map((r) => r.map((x) => clean(x))),

          theme: "grid",

          styles: {

            font: "helvetica",

            fontSize: 10,

            cellPadding: 6,

            lineColor: [220, 220, 220],

          },

          headStyles: {

            fillColor: [37, 99, 235],

            textColor: 255,

            fontStyle: "bold",

          },

          alternateRowStyles: { fillColor: [245, 247, 252] },

          columnStyles: { 0: { cellWidth: 260 } },

          margin: { left: margin, right: margin },

        });

      } catch (e) {

        debugLog("Falha no autoTable. Imprimindo fallback de texto.", e);

        linhas.forEach(([campo, valor]) => {

          doc.text(`${clean(campo)}: ${clean(valor)}`, margin, y);

          y += 14;

        });

      }



      y =

        doc.lastAutoTable && doc.lastAutoTable.finalY

          ? doc.lastAutoTable.finalY + 20

          : y + 12;



      // >>> ALTERACAO: ALERTO DE IOF/DIVERGENCIA NO PDF (caixa destacada)

      {

        const largura = pageWidth - margin * 2;

        const alerta =

          "ATENCAO: O calculo gerado pelo sistema NAO incide IOF e o valor para financiamento PODE haver divergencia de valores.";

        const alertaWrapped = doc.splitTextToSize(clean(alerta), largura - 12);

        const altura = alertaWrapped.length * 12 + 16;



        doc.setDrawColor(180, 120, 0);

        doc.setFillColor(255, 248, 233);

        doc.rect(margin, y, largura, altura, "FD");



        doc.setFont("helvetica", "bold");

        doc.setTextColor(120, 80, 0);

        doc.setFontSize(11);

        doc.text(alertaWrapped, margin + 8, y + 12);

        y += altura + 14;

      }



      doc.setFont("helvetica", "italic");

      doc.setFontSize(9);

      doc.setTextColor(80, 80, 80);



      const taxaFinalTxt = Number.isFinite(Number(taxaFinal))

        ? `${Number(taxaFinal).toFixed(2)}`

        : "-";

      const taxaPoliticaTxt =

        taxaPolitica !== null && Number.isFinite(Number(taxaPolitica))

          ? `${Number(taxaPolitica).toFixed(2)}`

          : "-";

      const taxaOriginalTxt = Number.isFinite(Number(taxaOriginal))

        ? `${Number(taxaOriginal).toFixed(2)}`

        : "-";

      const taxaSeguroTxt =

        taxaSeguroMensal > 0 ? `${taxaSeguroMensal.toFixed(3)}` : "-";

      const taxaComSegTxt =

        taxaComSeguro > 0 ? `${taxaComSeguro.toFixed(3)}` : "-";



      doc.text(

        clean(

          `Taxas (a.m.): Final ${taxaFinalTxt}% | Politica ${taxaPoliticaTxt}% | Origem ${taxaOriginalTxt}% | Seguro ${taxaSeguroTxt}% | Final+Seguro ${taxaComSegTxt}%`

        ),

        margin,

        y

      );

      y += 22;



      doc.setFont("helvetica", "bold");

      doc.setFontSize(14);

      doc.setTextColor(150, 27, 27);

      doc.text(

        clean("ATENCAO: SIMULACAO SUJEITA A ALTERACOES"),

        margin,

        y

      );

      y += 16;



      doc.setFont("helvetica", "normal");

      doc.setFontSize(11);

      doc.setTextColor(40, 40, 40);

      const disclaimer =

        "ESTE DOCUMENTO NAO E PROPOSTA FIRMADA. Os valores apresentados sao APENAS UMA SIMULACAO e podem mudar por diversos fatores, como: data de assinatura do novo contrato, nova avaliacao do contrato, alteracoes de condicoes de credito, data de pagamento, incidencia de tributos/seguros/tarifas e politicas internas. A aprovacao esta sujeita a analise.";

      const wrapped = doc.splitTextToSize(

        clean(disclaimer),

        pageWidth - margin * 2

      );

      doc.text(wrapped, margin, y);



      doc.setFontSize(9);

      doc.setTextColor(120, 120, 120);

      doc.text(

        clean("Recoopera - Simulacao gerada automaticamente"),

        margin,

        812

      );



      let saved = false;

      const finalize = () => {

        if (saved) return;

        saved = true;

        const ts = new Date()

          .toISOString()

          .slice(0, 19)

          .replace(/[:T.]/g, "-");

        const fileName = `Simulacao_Repactuacao_${clean(

          cpf || "cliente"

        )}_${ts}.pdf`;

        doc.save(fileName);

      };



      try {

        const img = new Image();

        img.crossOrigin = "anonymous";

        img.src = "/logo.jpg";



        img.onload = () => {

          try {

            doc.addImage(

              img,

              "JPEG",

              logoPos.x,

              logoPos.y,

              logoPos.w,

              logoPos.h

            );

          } catch (e) {

            debugLog("addImage falhou", e);

          }

          finalize();

        };



        img.onerror = finalize;

        setTimeout(finalize, 800);

      } catch (e) {

        debugLog("Erro ao tentar carregar a logo", e);

        finalize();

      }

    } catch (err) {

      alert("Falha ao gerar PDF da simulacao. Tente novamente.");

      try {

        const pre = document.createElement("pre");

        pre.style.cssText =

          "position:fixed;bottom:8px;left:8px;max-width:50vw;max-height:40vh;overflow:auto;background:#2a1f0b;color:#f1cfa0;border:1px solid #b45309;padding:8px;border-radius:8px;z-index:99999;font-size:12px;";

        pre.textContent =

          "Erro ao gerar PDF:\n" +

          (err && err.stack ? err.stack : String(err));

        document.body.appendChild(pre);

        setTimeout(() => pre.remove(), 10000);

      } catch {}

    }

  }



  // ===============================

  // UI

  // ===============================

  return (

    <div className="sn-container">

      <div className="sn-header">

        <div className="rn-title-wrapper">

          <img

            src="/recoopera-completo.png"

            alt="Recoopera"

            className="rn-logo"

          />

        </div>



        <div className="sn-title" style={{ marginRight: "auto" }}>Simulacao de Repactuacao</div>



        <span className="sn-chip">

          <span>Cliente</span>

          <strong className="sn-strong">{nomeCliente || "-"}</strong>

        </span>



        <span className="sn-chip">

          <span>CPF</span>

          <strong className="sn-strong">{cpf || "-"}</strong>

        </span>



        <div

          className="sn-chip"

          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}

          title="Usuario logado"

        >

          Usuario:{" "}

          {typeof user === "string"

            ? user

            : user?.nome ||

              user?.usuario ||

              user?.user ||

              user?.login ||

              "Usuario"}

        </div>



        <button

          className="sn-button"

          style={{

            background: "#1d4ed8",

            borderColor: "#1e3a8a",

            color: "#ffffff",

          }}

          onClick={voltar}

          title="Voltar para renegociacao"

        >

          Voltar

        </button>

      </div>



      <div className="sn-grid">

        {/* COLUNA ESQUERDA - CONTROLES */}

        <div className="sn-card">

          {/* SALDO */}

          <div className="sn-row">

            <div>

              <div className="sn-label">Saldo Total</div>

              <div className="sn-value">

                {fmtBRL(totalRecalculado)}

              </div>

            </div>

            <div>

              <div className="sn-label">Menor Taxa de Origem</div>

              <div className="sn-value">

                {Number.isFinite(taxaOriginal)

                  ? `${taxaOriginal.toFixed(2)}% a.m.`

                  : "-"}

              </div>

            </div>

          </div>



          {/* ENTRADA */}

          <div className="sn-section">

            <div className="sn-label">

              % de Entrada{" "}

              <span className="sn-badge">

                sugestao minima: 10%

              </span>

            </div>

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 12,

                flexWrap: "wrap",

              }}

            >

              <input

                type="range"

                min={0}

                max={100}

                step={0.0001} 

                value={entradaPercentual}

                onChange={(e) =>

                  setEntradaPercentual(Number(e.target.value))

                }

                className="sn-slider"

              />

              <input

                type="number"

                min={0}

                max={100}

                step={0.0001} 

                value={entradaPercentual}

                onChange={(e) => {

                  const v = Math.min(

                    100,

                    Math.max(0, Number(e.target.value) || 0)

                  );

                  setEntradaPercentual(v);

                }}

                className="sn-number"

              />

              <span className="sn-chip">

                <strong className="sn-strong">

                  {/* >>> ALTERACAO: exibir apenas 4 casas decimais (truncado) */}

                  {formatPercent4(entradaPercentual)}%

                </strong>{" "}

                / {fmtBRL(entradaValor)}

              </span>

            </div>



            {/* Valor de entrada editavel */}

            <div style={{ marginTop: 10 }}>

              <div className="sn-label">Valor da entrada (R$)</div>

              <input

                type="text"

                className="sn-input"

                inputMode="decimal"

                value={

                  entradaValorInput === ""

                    ? fmtBRL(entradaValor)

                    : entradaValorInput

                }

                onChange={(e) => setEntradaValorInput(e.target.value)}

                onBlur={handleBlurEntradaValor}

                placeholder="Digite o valor da entrada em R$"

              />

              <div className="sn-small" style={{ marginTop: 4 }}>

                Ao editar o valor, o percentual sera ajustado

                automaticamente (sem arredondar; a exibicao mostra ate 4 casas).

              </div>

            </div>



            <div className="sn-small" style={{ marginTop: 6 }}>

              Faixa atual: <strong>{faixaEntrada}</strong>

            </div>

          </div>



          {/* PRAZO */}

          <div className="sn-section">

            <div className="sn-label">Prazo</div>

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 12,

              }}

            >

              <input

                type="range"

                min={6}

                max={60}

                step={1}

                value={prazo}

                onChange={(e) => {

                  const v = Number(e.target.value) || 6;

                  setPrazo(v);

                  setPrazoInput(String(v));

                }}

                className="sn-slider"

              />

              <input

                type="number"

                min={6}

                max={60}

                value={prazoInput}

                onChange={(e) => {

                  const value = e.target.value;

                  setPrazoInput(value);

                  if (value === "") return;

                  const num = Number(value);

                  if (!Number.isFinite(num)) return;

                  const v = Math.min(60, Math.max(6, num));

                  setPrazo(v);

                }}

                onBlur={() => {

                  if (

                    prazoInput === "" ||

                    !Number.isFinite(Number(prazoInput))

                  ) {

                    const padrao = 24;

                    setPrazo(padrao);

                    setPrazoInput(String(padrao));

                  } else {

                    const num = Number(prazoInput);

                    const v = Math.min(60, Math.max(6, num));

                    setPrazo(v);

                    setPrazoInput(String(v));

                  }

                }}

                className="sn-number"

              />

              <span className="sn-chip">

                <strong className="sn-strong">{prazo}</strong> X

              </span>

            </div>

            <div className="sn-small" style={{ marginTop: 6 }}>

              Tipo de prazo: <strong>{prazoTipo}</strong>

            </div>

          </div>



          {/* IDADE / SEGURO */}

          <div className="sn-section">

            <div className="sn-label">

              Idade do cooperado (para calculo do seguro obrigatorio)

            </div>

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 12,

              }}

            >

              <input

                type="number"

                min={18}

                max={120}

                value={idade}

                onChange={(e) => setIdade(e.target.value)}

                className="sn-number"

                placeholder="Ex.: 50"

              />

              <span className="sn-chip">

                {taxaSeguroMensal > 0 ? (

                  <>

                    Taxa seguro:{" "}

                    <strong className="sn-strong">

                      {taxaSeguroMensal.toFixed(3)}% a.m.

                    </strong>

                  </>

                ) : (

                  "Informe a idade para calcular o seguro"

                )}

              </span>

            </div>

            <div className="sn-small" style={{ marginTop: 6 }}>

              0,060% a.m. para ate 64 anos; 0,120% a.m. para 65 anos ou

              mais.

            </div>

          </div>



          {/* NOVA GARANTIA REAL */}

          <div className="sn-section">

            <label

              className="sn-switch"

              style={{ cursor: "pointer" }}

            >

              <input

                type="checkbox"

                checked={adicionarGarantiaReal}

                onChange={(e) => handleGarantiaRealChange(e.target.checked)}

              />

              <span className="track">

                <span className="thumb" />

              </span>

              <span>Adicionar nova garantia real?</span>

            </label>



            {adicionarGarantiaReal && (

              <div style={{ marginLeft: 6, marginTop: 8 }}>

                <div className="sn-small" style={{ color: "#86efac" }}>

                  OK Garantia real adicionada{campanhaAplicadaSistema ? " - campanha ativada automaticamente" : ""}

                </div>

              </div>

            )}

          </div>



          {/* AVALISTA */}

          <div className="sn-section">

            <label

              className="sn-switch"

              style={{ marginBottom: 10 }}

            >

              <input

                type="checkbox"

                checked={temAvalista}

                onChange={(e) => handleAvalistaChange(e.target.checked)}

              />

              <span className="track">

                <span className="thumb" />

              </span>

              <span>

                Adicionar novo avalista (alem dos contratos

                originais)

              </span>

            </label>



            {temAvalista && (

              <div style={{ marginLeft: 6 }}>

                <div className="sn-label">

                  Nome ou CPF do avalista (opcional)

                </div>

                <input

                  type="text"

                  value={dadosAvalista}

                  onChange={(e) =>

                    setDadosAvalista(e.target.value)

                  }

                  className="sn-input"

                  placeholder="Digite o nome completo ou CPF"

                />

                <div style={{ marginTop: 10 }}>

                  <label className="sn-switch">

                    <input

                      type="checkbox"

                      checked={avalEhSocio}

                      onChange={(e) =>

                        setAvalEhSocio(e.target.checked)

                      }

                    />

                    <span className="track">

                      <span className="thumb" />

                    </span>

                    <span>

                      Avalista e socio? (nao gera desconto)

                    </span>

                  </label>

                </div>

              </div>

            )}

          </div>

        </div>



        {/* COLUNA DIREITA - RESULTADO */}

        <div className="sn-card">

          <div

            style={{

              display: "flex",

              gap: 8,

              flexWrap: "wrap",

              marginBottom: 8,

            }}

          >

            {campanhaAtiva && (

              <span className="sn-badge green">

                {ehCampanhaPrejuizo ? "Campanha de Prejuizo aplicada" : "Campanha aplicada"}

              </span>

            )}



            {taxaPolitica === null &&

              elegivel &&

              entradaPercentual >= 10 && (

                <span className="sn-badge amber">

                  Elegivel, mas sem enquadramento de faixa

                </span>

              )}



            {/* Badge para campanha de prejuizo disponivel */}

            {ehCampanhaPrejuizo && !campanhaAtiva && (

              <span className="sn-badge blue">

                Campanha de Prejuizo disponivel (exclusiva para contratos em prejuizo)

              </span>

            )}



            {/* Badge para mistura de contratos */}

            {regrasCampanha.motivoBloqueio && (

              <span className="sn-badge red">

                {regrasCampanha.motivoBloqueio}

              </span>

            )}



            {/* Botao para ativar/desativar campanha manualmente */}

            {podeAtivarCampanha && (

              <button

                type="button"

                className="sn-badge"

                style={{

                  cursor: "pointer",

                  background: campanhaAtivaManualmente 

                    ? "rgba(34,197,94,.15)" 

                    : "rgba(59,130,246,.15)",

                  color: campanhaAtivaManualmente ? "#16a34a" : "#2563eb",

                }}

                onClick={handleToggleCampanha}

                title={

                  campanhaAtivaManualmente

                    ? "Clique para desativar a campanha"

                    : `Clique para ativar ${ehCampanhaPrejuizo ? 'a Campanha de Prejuizo' : 'a campanha de desconto'}`

                }

              >

                {campanhaAtivaManualmente

                  ? `${ehCampanhaPrejuizo ? 'Campanha de Prejuizo' : 'Campanha'} ativada manualmente`

                  : `Ativar ${ehCampanhaPrejuizo ? 'Campanha de Prejuizo' : 'Campanha'}`

                }

              </button>

            )}



            {/* Badge para contratos em prejuizo */}

            {contratosPrejuizo.length > 0 && (

              <span className="sn-badge purple">

                {contratosPrejuizo.length} contrato(s) em prejuizo

              </span>

            )}



            {bloqueioPorTaxaMinima && (

              <span className="sn-badge red">

                Taxa origem &lt; 1,50% a.m. - prevalece origem

              </span>

            )}

          </div>



          <div className="sn-row-3">

            <div>

              <div className="sn-label">

                Entrada (estimativa)

              </div>

              <div className="sn-value">

                {fmtBRL(entradaValor)}

              </div>

              <div className="sn-small">

                Baseada no saldo exibido

              </div>

            </div>

            <div>

              <div className="sn-label">

                Saldo a financiar

              </div>

              <div className="sn-value">

                {fmtBRL(saldoFinanciar)}

              </div>

            </div>

            <div>

              <div className="sn-label">

                Parcela estimada

              </div>

              <div className="sn-value">

                {fmtBRL(parcelaEstimativa)}

              </div>

              <div className="sn-small">

                Simulacao (Sujeito a alteracao)

              </div>

            </div>

          </div>



          <div className="sn-section">

            <div className="sn-row">

              <div>

                <div className="sn-label">Taxa Original</div>

                <div className="sn-value">

                  {Number.isFinite(taxaOriginal)

                    ? `${taxaOriginal.toFixed(2)}% a.m.`

                    : "-"}

                </div>

              </div>

              <div>

                <div className="sn-label">Taxa Politica</div>

                <div className="sn-value">

                  {taxaPolitica !== null &&

                  Number.isFinite(taxaPolitica)

                    ? `${taxaPolitica.toFixed(2)}% a.m.`

                    : "-"}

                </div>

              </div>

            </div>



            <div className="sn-divider" />



            <div className="sn-row" style={{ marginBottom: 12 }}>

              <div>

                <div className="sn-label">

                  Taxa Seguro Obrigatoria

                </div>

                <div className="sn-value">

                  {taxaSeguroMensal > 0

                    ? `${taxaSeguroMensal.toFixed(3)}% a.m.`

                    : "-"}

                </div>

                <div className="sn-small">

                  0,060% a.m. ate 64 anos; 0,120% a.m. a partir de

                  65.

                </div>

              </div>

              <div>

                <div className="sn-label">

                  Taxa Total c/ Seguro

                </div>

                <div className="sn-value">

                  {taxaComSeguro > 0

                    ? `${taxaComSeguro.toFixed(3)}% a.m.`

                    : "-"}

                </div>

                <div className="sn-small">

                  Usada na estimativa da parcela.

                </div>

              </div>

            </div>



            <div>

              <div className="sn-label">Taxa Final Aplicada</div>

              <div

                className={`sn-final ${

                  melhorou ? "good" : ""

                }`}

              >

                {Number.isFinite(taxaFinal)

                  ? `${taxaFinal.toFixed(2)}% a.m.`

                  : "-"}

              </div>

              {melhorou ? (

                <div className="sn-small sn-ok">

                  Melhora sobre a taxa original aplicada OK

                </div>

              ) : (

                <div className="sn-small">

                  Sem melhora sobre a taxa original.

                </div>

              )}

            </div>

          </div>



          {alertas && alertas.length > 0 && (

            <div className="sn-section">

              <div className="sn-label">Atencoes</div>

              <div className="sn-alert">

                <ul

                  style={{ margin: 0, paddingLeft: 18 }}

                >

                  {alertas.map((a, i) => (

                    <li key={i}>{a}</li>

                  ))}

                </ul>

              </div>

            </div>

          )}



          <div className="sn-section">

            <button

              type="button"

              className="sn-button"

              onClick={gerarPDF}

            >

              Recalcular (Gerar PDF)

            </button>



            {campanhaAtiva && regrasCampanha.motivoBloqueio && (

              <div className="sn-alert" style={{ marginTop: 8 }}>

                {regrasCampanha.motivoBloqueio}. Revise a selecao ou registre a justificativa conforme a politica interna.

              </div>

            )}

          </div>

        </div>

      </div>



      {/* >>> ALTERACAO: ALERTA DE IOF/DIVERGENCIA ANTES DOS VALORES ADICIONAIS */}

      <div className="sn-card" style={{ marginTop: 16 }}>

        <div className="sn-alert" style={{ marginBottom: 12 }}>

          O calculo gerado pelo sistema <strong>nao incide IOF</strong> e o valor para

          financiamento <strong>pode haver divergencia</strong> de valores.

        </div>



        {/* VALORES ADICIONAIS - TROCO / ACRESCIMOS */}

        <div className="sn-label" style={{ marginBottom: 8 }}>

          Valores Adicionais

        </div>

        <div

          style={{

            display: "flex",

            flexWrap: "wrap",

            gap: 48, // afasta bem os campos

            alignItems: "flex-end",

            justifyContent: "space-between",

          }}

        >

          <div style={{ minWidth: 220 }}>

            <div className="sn-label">Troco (R$)</div>

            <input

              type="text"

              className="sn-input"

              inputMode="decimal"

              value={troco}

              onChange={(e) => setTroco(e.target.value)}

              placeholder="Opcional"

            />

          </div>



          <div style={{ minWidth: 220 }}>

            <div className="sn-label">Acrescimos (R$)</div>

            <input

              type="text"

              className="sn-input"

              inputMode="decimal"

              value={acrescimos}

              onChange={(e) => setAcrescimos(e.target.value)}

              placeholder="Opcional"

            />

          </div>



          <div style={{ minWidth: 260 }}>

            <div className="sn-label">Total de adicionais</div>

            <div className="sn-value">

              {fmtBRL(totalAdicionais)}

            </div>

            <div className="sn-small">

              Somado ao saldo total e a parcela estimada.

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}




