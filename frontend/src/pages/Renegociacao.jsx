import { useEffect, useMemo, useState } from "react";

import { api } from "../services/api";

import { useNavigate, useLocation } from "react-router-dom";

import { audit } from "../services/clientLogger";



export default function Renegociacao() {

  const [cpf, setCpf] = useState("");

  const [loading, setLoading] = useState(false);

  const [erro, setErro] = useState("");



  const [contratos, setContratos] = useState([]);

  const [selecionados, setSelecionados] = useState([]);

  const [cliente, setCliente] = useState({ nome: "", cpfCnpj: "" });

  const [cpfPesquisado, setCpfPesquisado] = useState("");



  // Estados para busca em tempo real

  const [sugestoes, setSugestoes] = useState([]);

  const [mostrarSugestoes, setMostrarSugestoes] = useState(false);

  const [buscandoSugestoes, setBuscandoSugestoes] = useState(false);

  const [selecionandoSugestao, setSelecionandoSugestao] = useState(false);

  const [sugestaoSelecionada, setSugestaoSelecionada] = useState(null);



  const [taxaResumoInput, setTaxaResumoInput] = useState("");

  const [editandoMenorTaxa, setEditandoMenorTaxa] = useState(false);

  const [taxasEdicao, setTaxasEdicao] = useState({}); // idContrato -> texto digitado



  // Novo: modo de edicao dos totais devidos (todas as operacÃµes)

  const [editandoTotalGeral, setEditandoTotalGeral] = useState(false);



  const navigate = useNavigate();

  const location = useLocation();



  // Verifica se ha CPF pre-selecionado ao voltar da simulacao

  useEffect(() => {

    const state = location.state;

    if (state?.cpfPreSelecionado) {

      setCpf(state.cpfPreSelecionado);

      

      // Se tiver dados do cliente e contratos, restaura automaticamente

      if (state?.nomeCliente && state?.contratos?.length > 0) {

        setCliente({ nome: state.nomeCliente, cpfCnpj: state.cpfPreSelecionado });

        setCpfPesquisado(state.cpfPreSelecionado);

        setContratos(state.contratos);

        setSelecionados([]);

      }

      

      // Limpa o state usando window.history para nao afetar futuras navegacÃµes

      window.history.replaceState({}, document.title, location.pathname);

    }

  }, [location.state, location.pathname]);



  // ===============================

  // HELPERS

  // ===============================

  const soDigitos = (v) => (v || "").replace(/\D+/g, "");

  const isCPF = (digits) => digits.length === 11;

  const isCNPJ = (digits) => digits.length === 14;



  const maskCpfCnpj = (v) => {

    // Se contiver letras, nao aplica mascara (e um nome)

    if (/[a-zA-Z]/.test(v)) {

      return v;

    }

    

    const d = soDigitos(v);

    if (d.length <= 11) {

      // CPF: 000.000.000-00

      return d

        .replace(/^(\d{3})(\d)/, "$1.$2")

        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")

        .replace(/\.(\d{3})(\d)/, ".$1-$2")

        .slice(0, 14);

    }

    // CNPJ: 00.000.000/0000-00

    return d

      .replace(/^(\d{2})(\d)/, "$1.$2")

      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")

      .replace(/\.(\d{3})(\d)/, ".$1/$2")

      .replace(/\/(\d{4})(\d)/, "$1-$2")

      .slice(0, 18);

  };



  const cpfCnpjExibido = useMemo(() => {

    const doc = cliente.cpfCnpj || cpfPesquisado || "";

    return maskCpfCnpj(doc);

  }, [cliente.cpfCnpj, cpfPesquisado]);



  const fmtBRL = (v) =>

    (Number.isFinite(v) ? v : 0).toLocaleString("pt-BR", {

      style: "currency",

      currency: "BRL",

    });



  const parseBRL = (str) => {

    const digits = String(str ?? "").replace(/\D/g, "");

    if (!digits) return 0;

    // Converte centavos para reais (divide por 100)

    return Number(digits) / 100;

  };



  // ===============================

  // ESTILOS (injetados no documento)

  // ===============================

  useEffect(() => {

    const id = "renegociacao-styles";

    const existing = document.getElementById(id);

    if (existing) existing.remove();

    const style = document.createElement("style");

    style.id = id;

    style.innerHTML = `

.rn-container {

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



.rn-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;

  margin-bottom: 16px;

}



.rn-title-wrapper {

  display: flex;

  align-items: center;

  gap: 12px;

}



.rn-logo {

  height: 34px;

  width: auto;

}



.rn-chip {

  display: inline-flex;

  align-items: center;

  gap: 8px;

  background: var(--chip);

  border: 1px solid var(--divider);

  padding: 8px 14px;

  border-radius: 999px;

  color: var(--text);

  font-size: 12px;

}



.rn-grid {

  display: grid;

  gap: 24px;

  grid-template-columns: 3fr 1fr;

}



@media (min-width: 900px) {

  .rn-grid {

    grid-template-columns: 3fr 1fr;

  }

}



.rn-card {

  background: var(--color-bg-card);

  border: 1px solid var(--divider);

  border-radius: var(--radius);

  box-shadow: var(--shadow);

  backdrop-filter: blur(10px);

  padding: 26px 26px 22px;

}



.rn-section + .rn-section {

  border-top: 1px dashed var(--divider);

  margin-top: 20px;

  padding-top: 20px;

}



.rn-label {

  color: var(--muted);

  font-size: 12px;

  margin-bottom: 6px;

  letter-spacing: .3px;

}



.rn-input {

  background: var(--color-bg-input);

  border: 1px solid var(--divider);

  border-radius: 10px;

  color: var(--text);

  padding: 14px 16px;

  outline: none;

  width: 100%;

  font-size: 14px;

}



.rn-input-money {

  font-variant-numeric: tabular-nums;

  border-radius: 10px;

}



.rn-button {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  gap: 8px;

  border: 1px solid var(--divider);

  padding: 12px 18px;

  border-radius: 10px;

  background: var(--color-bg-input);

  color: var(--text);

  cursor: pointer;

  font-size: 14px;

}



.rn-button.primary {

  background: linear-gradient(180deg, var(--primary), var(--primary-700));

  border-color: transparent;

  color: #ffffff;

}



.rn-button.primary:disabled {

  opacity: .6;

  cursor: not-allowed;

}



.rn-button.warn {

  background: #2a1f0b;

  border-color: #3a2a10;

  color: #facc15;

}



.rn-row {

  display: grid;

  grid-template-columns: 1fr 1fr;

  gap: 16px;

}

  .rn-chip {

  transition: transform .08s ease, border-color .12s ease, background .12s ease;

}



button.rn-chip:hover {

  border-color: rgba(37,99,235,.55);

  background: rgba(37,99,235,.10);

}



button.rn-chip:active {

  transform: translateY(1px);

}



button.rn-chip:focus-visible {

  outline: 2px solid rgba(37,99,235,.55);

  

  outline-offset: 2px;

}





.rn-badge {

  background: rgba(37,99,235,.15);

  color: #93c5fd;

  border: 1px solid rgba(37,99,235,.35);

  border-radius: 8px;

  padding: 6px 10px;

  font-size: 12px;

}



.rn-chip-status {

  display: inline-flex;

  align-items: center;

  padding: 4px 10px;

  border-radius: 999px;

  font-size: 11px;

  border: 1px solid var(--divider);

}



.st-atraso { background: rgba(220,38,38,.08); color: #fecaca; }

.st-dia    { background: rgba(22,163,74,.08); color: #bbf7d0; }

.st-prej   { background: rgba(244,114,182,.08); color: #fbcfe8; }



.rn-alert {

  background: #1b1f2e;

  border: 1px solid #2b3448;

  border-left: 4px solid var(--warning);

  padding: 12px 16px;

  border-radius: 8px;

  color: #f1cfa0;

}



.rn-table-wrap {

  max-height: 55vh;

  overflow: auto;

  border: 1px solid var(--divider);

  border-radius: 10px;

}



table.rn-table {

  width: 100%;

  border-collapse: separate;

  border-spacing: 0;

  font-size: 13px;

}



.rn-table thead th {

  position: sticky;

  top: 0;

  z-index: 1;

  background: var(--color-table-header);

  color: var(--text);

  text-align: left;

  border-bottom: 1px solid var(--divider);

  padding: 12px 16px;

}



.rn-table tbody td {

  border-bottom: 1px dashed var(--divider);

  padding: 10px 16px;

}



.rn-table tbody tr:nth-child(odd) {

  background: var(--table-row-alt, rgba(0, 0, 0, 0.04));

}



.rn-right { text-align: right; }



.rn-divider {

  height: 1px;

  background: var(--divider);

  margin: 16px 0;

}



.rn-empty {

  color: var(--muted);

  font-style: italic;

  padding: 10px 0;

}

`;

    document.head.appendChild(style);



    return () => {

      style.remove();

    };

  }, []);



  // ===============================

  // BUSCA EM TEMPO REAL

  // ===============================

  const buscarSugestoes = async (termo) => {

    if (termo.length < 3) {

      setSugestoes([]);

      setMostrarSugestoes(false);

      return;

    }



    // Se for apenas digitos, nao busca sugestÃµes (e CPF/CNPJ)

    if (/^\d+$/.test(termo)) {

      setSugestoes([]);

      setMostrarSugestoes(false);

      return;

    }



    try {

      setBuscandoSugestoes(true);

      const response = await api.get(`/renegociacoes/pesquisar-por-nome/${encodeURIComponent(termo)}`);

      

      // Remove duplicatas - agrupa por CPF e pega so um por associado

      const associadosUnicos = new Map();

      (response.data || []).forEach(c => {

        const key = c.cpfCnpj; // CPF como chave unica

        if (!associadosUnicos.has(key)) {

          associadosUnicos.set(key, {

            nome: c.nomeCliente,

            cpfCnpj: c.cpfCnpj,

            numeroContrato: c.numeroContrato

          });

        }

      });

      

      const sugestoesFormatadas = Array.from(associadosUnicos.values());

      setSugestoes(sugestoesFormatadas);

      setMostrarSugestoes(sugestoesFormatadas.length > 0);

    } catch (err) {

      console.error(err);

      setSugestoes([]);

      setMostrarSugestoes(false);

    } finally {

      setBuscandoSugestoes(false);

    }

  };



  // Debounce para nao fazer muitas requisicÃµes

  useEffect(() => {

    const timer = setTimeout(() => {

      buscarSugestoes(cpf);

    }, 300);



    return () => clearTimeout(timer);

  }, [cpf]);



  // Fecha sugestÃµes ao clicar fora do campo

  useEffect(() => {

    const handleClickOutside = (event) => {

      // Verifica se o clique foi fora do container de sugestÃµes

      if (mostrarSugestoes && !event.target.closest('.sugestoes-container')) {

        setMostrarSugestoes(false);

        setSugestoes([]);

      }

    };



    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);

  }, [mostrarSugestoes]);



  // ===============================

  // BUSCA POR NOME ESPECIFICA

  // ===============================

  const buscarContratosPorNome = async (nome, cpfCnpj) => {

    try {

      setLoading(true);

      setErro("");

      

      // Busca por CPF (mais eficiente e evita duplicatas)

      const digits = soDigitos(cpfCnpj);

      const response = await api.get(`/renegociacoes/${digits}`);

      

      setCpfPesquisado(nome);

      setCliente({ nome, cpfCnpj });



      const data = (response.data || [])

        .map((c, index) => {

          const taxaRaw = Number(c.taxaOperacaoPercentual) || 0;



          const saldoBase =

            Number(

              c.saldoBaseNegociacao ??

                c.valorRecalculado ??

                c.saldoContabilBruto ??

                c.valorCorrigido ??

                c.valorSaldoContabilBruto

            ) || 0;



          const totalDevido =

            Number(

              c.totalDevido ??

                c.saldoBaseNegociacao ??

                c.valorSaldoContabilBruto ??

                0

            ) || 0;



          const numeroContratoNum = Number(c.numeroContrato);

          const idContrato =

            Number.isFinite(numeroContratoNum) && numeroContratoNum !== -1

              ? String(numeroContratoNum)

              : `${cpfCnpj}:${

                  Number.isFinite(numeroContratoNum) ? "-1" : "sem-numero"

                }:${index}`;



          return {

            idContrato,

            numeroContrato: Number(c.numeroContrato),

            tipoContrato: c.tipoContrato,

            submodalidade: c.submodalidadeBacen,

            diasAtraso: Number(c.diasAtrasoParcela) || 0,

            ehPrejuizo: c.ehPrejuizo === true,

            ehAjuizado: c.ehAjuizado === true,



            taxa: Number(taxaRaw.toFixed(4)),

            saldoBase,

            totalDevido,

            valorContrato: Number(c.valorContrato) || 0,

            valorPago: Number(c.valorPago) || 0,

          };

        })

        .filter((c) => !(c.numeroContrato === -1 && c.diasAtraso === 0));



      setContratos(data);

      setSelecionados([]);

      setMostrarSugestoes(false);

      setSugestoes([]);

      setTaxaResumoInput("");

      setEditandoMenorTaxa(false);

      setTaxasEdicao({});

      setEditandoTotalGeral(false);

    } catch (err) {

      console.error(err);

      setErro("Erro ao buscar contratos. Tente novamente.");

      setContratos([]);

      setSelecionados([]);

    } finally {

      setLoading(false);

    }

  };



  // ===============================

  // BUSCA

  // ===============================

  async function buscar() {

    try {

      setLoading(true);

      setErro("");



      const searchTerm = cpf.trim();

      const digits = soDigitos(searchTerm);

      

      let response;

      

      // Se for CPF/CNPJ (com ou sem mascara), busca por CPF/CNPJ

      if ((isCPF(digits) || isCNPJ(digits))) {

        response = await api.get(`/renegociacoes/${digits}`);

      } 

      // Se for nome, busca por nome

      else if (searchTerm.length > 0 && !/^\d+$/.test(searchTerm)) {

        response = await api.get(`/renegociacoes/pesquisar-por-nome/${encodeURIComponent(searchTerm)}`);

      } 

      // Se for invalido

      else {

        setErro("Informe um CPF (11 digitos), CNPJ (14 digitos) ou Nome do Associado.");

        setContratos([]);

        setSelecionados([]);

        return;

      }



      setCpfPesquisado(searchTerm);



      // Quando busca por nome, define cliente com o primeiro resultado

      if (digits !== searchTerm) {

        // Busca por nome - define cliente com o primeiro resultado

        const nome = (response.data?.[0]?.nomeCliente || "").trim();

        const doc = (response.data?.[0]?.cpfCnpj || "").toString();

        setCliente({ nome, cpfCnpj: doc });

      } else {

        // Busca por CPF/CNPJ - define cliente unico

        const nome = (response.data?.[0]?.nomeCliente || "").trim();

        const doc = (response.data?.[0]?.cpfCnpj || digits).toString();

        setCliente({ nome, cpfCnpj: doc });

      }



      const data = (response.data || [])

        .map((c, index) => {

          const taxaRaw = Number(c.taxaOperacaoPercentual) || 0;



          const saldoBase =

            Number(

              c.saldoBaseNegociacao ??

                c.valorRecalculado ??

                c.saldoContabilBruto ??

                c.valorCorrigido ??

                c.valorSaldoContabilBruto

            ) || 0;



          const totalDevido =

            Number(

              c.totalDevido ??

                c.saldoBaseNegociacao ??

                c.valorSaldoContabilBruto ??

                0

            ) || 0;



          const numeroContratoNum = Number(c.numeroContrato);

          const idContrato =

            Number.isFinite(numeroContratoNum) && numeroContratoNum !== -1

              ? String(numeroContratoNum)

              : `${digits}:${

                  Number.isFinite(numeroContratoNum) ? "-1" : "sem-numero"

                }:${index}`;



          return {

            idContrato,

            numeroContrato: Number(c.numeroContrato),

            tipoContrato: c.tipoContrato,

            submodalidade: c.submodalidadeBacen,

            diasAtraso: Number(c.diasAtrasoParcela) || 0,

            ehPrejuizo: c.ehPrejuizo === true,

            ehAjuizado: c.ehAjuizado === true,



            taxa: Number(taxaRaw.toFixed(4)),

            saldoBase,

            totalDevido,

            valorContrato: Number(c.valorContrato) || 0,

            valorPago: Number(c.valorPago) || 0,

          };

        })

        .filter((c) => !(c.numeroContrato === -1 && c.diasAtraso === 0));



      setContratos(data);

      setSelecionados([]);

      setTaxaResumoInput("");

      setEditandoMenorTaxa(false);

      setTaxasEdicao({});

      setEditandoTotalGeral(false);

    } catch (err) {

      console.error(err);

      setErro("Erro ao buscar contratos. Tente novamente.");

      setContratos([]);

      setSelecionados([]);

    } finally {

      setLoading(false);

    }

  };



  const onKeyDownCpf = (e) => {

    if (e.key === "Enter") {

      // Fecha sugestÃµes ao pressionar Enter

      setMostrarSugestoes(false);

      setSugestoes([]);

      buscar();

    }

  };



  // ===============================

  // REGRAS DE AGRUPAMENTO

  // ===============================

  function isContratoPrejuizo(c) {

    return c.ehPrejuizo;

  }

  function isContratoAtrasado(c) {

    return c.diasAtraso > 0 && !isContratoPrejuizo(c);

  }

  function isContratoEmDia(c) {

    return c.diasAtraso === 0 && !isContratoPrejuizo(c);

  }



  const contratosPrejuizo = useMemo(

    () => contratos.filter(isContratoPrejuizo),

    [contratos]

  );

  const contratosAtrasados = useMemo(

    () => contratos.filter(isContratoAtrasado),

    [contratos]

  );

  const contratosEmDia = useMemo(

    () => contratos.filter(isContratoEmDia),

    [contratos]

  );



  // ===============================

  // REGRAS DE CONTRATO ESPECIAL

  // (prejuizo, taxa 0 ou taxa 2,98)

  // ===============================

  function isContratoEspecial(c) {

    const taxa = Number(c?.taxa) || 0;

    const taxaZero = taxa === 0;

    const taxa298 = Number(taxa.toFixed(2)) === 2.98;

    return c.ehPrejuizo || taxaZero || taxa298;

  }



  // ===============================

  // SELECAO

  // ===============================

  function toggleContrato(idContrato) {

    const idStr = String(idContrato);

    const contrato = contratos.find((c) => c.idContrato === idStr);

    if (contrato?.ehAjuizado) {

      return;

    }

    

    // Alerta para contrato id -1 (cheque especial)

    if (contrato?.idContrato === "-1") {

      alert("Atencao: Voce selecionou um contrato com ID -1 (Cheque Especial). Este contrato requer validacao especial no SISBR antes de prosseguir com a simulacao.");

      return;

    }



    setSelecionados((prev) =>

      prev.includes(idStr)

        ? prev.filter((id) => id !== idStr)

        : [...prev, idStr]

    );

  }



  function toggleTodos(lista) {

    const selecionaveis = lista.filter((c) => !c.ehAjuizado);

    const idsSelecionaveis = selecionaveis.map((c) => String(c.idContrato));



    const todosMarcados =

      idsSelecionaveis.length > 0 &&

      idsSelecionaveis.every((id) => selecionados.includes(id));



    setSelecionados((prev) => {

      if (todosMarcados) {

        return prev.filter((id) => !idsSelecionaveis.includes(id));

      }

      const set = new Set([...prev, ...idsSelecionaveis]);

      return Array.from(set);

    });

  }



  // ===============================

  // ATUALIZACOES (TOTAL DEVIDO)

  // ===============================

  function atualizarSaldoContrato(idContrato, valorInput) {

    const novoValor = parseBRL(valorInput);

    setContratos((prev) =>

      prev.map((c) =>

        c.idContrato === idContrato

          ? { ...c, totalDevido: novoValor, saldoBase: novoValor }

          : c

      )

    );

  }



  // ===============================

  // RESUMO SELECIONADOS

  // ===============================

  const contratosSelecionados = useMemo(

    () => contratos.filter((c) => selecionados.includes(c.idContrato)),

    [contratos, selecionados]

  );



  const totalSelecionado = useMemo(

    () =>

      contratosSelecionados.reduce(

        (sum, c) => sum + (Number(c.totalDevido) || 0),

        0

      ),

    [contratosSelecionados]

  );



  const menorTaxa = useMemo(() => {

    if (contratosSelecionados.length === 0) return 0;

    return Math.min(...contratosSelecionados.map((c) => Number(c.taxa) || 0));

  }, [contratosSelecionados]);



  const hasContratoEspecialSelecionado = useMemo(

    () => contratosSelecionados.some(isContratoEspecial),

    [contratosSelecionados]

  );



  // Novo: contratos com taxa < 1% (para alerta SELIC)

  const hasContratoTaxaBaixa = useMemo(

    () => contratos.some((c) => (Number(c.taxa) || 0) < 1),

    [contratos]

  );



  // ===============================

  // NAVEGACAO

  // ===============================

  function simularNegociacao() {

    if (contratosSelecionados.length === 0) {

      alert("Selecione pelo menos um contrato para simular.");

      return;

    }



    const normalizados = contratosSelecionados.map((c) => {

      const total =

        Number(

          c?.totalDevido ?? c?.saldoBase ?? c?.valorSaldoContabilBruto ?? 0

        ) || 0;

      return { ...c, totalDevido: total, saldoBase: total };

    });



    navigate("/simulacao-negociacao", {

      state: {

        contratos: normalizados,

        todosContratos: contratos, // Adiciona todos os contratos

        cpf: soDigitos(cliente?.cpfCnpj || cpfPesquisado || cpf),

        nomeCliente: cliente?.nome || "",

      },

    });

  }



  // ===============================

  // EDICAO DE TAXA NA TABELA

  // ===============================

  function handleChangeTaxaInput(idContrato, value) {

    setTaxasEdicao((prev) => ({

      ...prev,

      [idContrato]: value,

    }));

  }



  function handleBlurTaxaInput(contrato) {

    const id = contrato.idContrato;

    const raw = (taxasEdicao[id] ?? "").trim();



    // Se apagou tudo ou nao digitou nada -> volta pro valor atual (nao altera contrato)

    if (raw === "") {

      setTaxasEdicao((prev) => {

        const novo = { ...prev };

        delete novo[id];

        return novo;

      });

      return;

    }



    const texto = raw.replace(",", ".").replace(/[^\d.]/g, "");

    const novaTaxa = parseFloat(texto);



    if (!Number.isFinite(novaTaxa)) {

      // valor invalido -> reseta visual

      setTaxasEdicao((prev) => {

        const novo = { ...prev };

        delete novo[id];

        return novo;

      });

      return;

    }



    // Aplica a nova taxa no contrato

    setContratos((prev) =>

      prev.map((c) => (c.idContrato === id ? { ...c, taxa: novaTaxa } : c))

    );



    // Mantem o valor formatado no input

    setTaxasEdicao((prev) => ({

      ...prev,

      [id]: novaTaxa.toFixed(2),

    }));

  }



  // ===============================

  // UI: TABELA

  // ===============================

  function renderTabela(lista, tituloSeletor) {

    if (!lista || lista.length === 0) {

      return <p className="rn-empty">Sem contratos</p>;

    }



    const selecionaveis = lista.filter((c) => !c.ehAjuizado);

    const idsSelecionaveis = selecionaveis.map((c) => c.idContrato);



    const todosMarcados =

      idsSelecionaveis.length > 0 &&

      idsSelecionaveis.every((id) => selecionados.includes(id));



    const headerCheckboxDisabled = idsSelecionaveis.length === 0;



    return (

      <div className="rn-table-wrap">

        <table className="rn-table">

          <thead>

            <tr>

              <th style={{ width: 36 }}>

                <input

                  type="checkbox"

                  checked={todosMarcados}

                  onChange={() => toggleTodos(lista)}

                  title={`Selecionar todos - ${tituloSeletor}`}

                  disabled={headerCheckboxDisabled}

                />

              </th>

              <th>Contrato</th>

              <th>Tipo</th>

              <th>Submodalidade</th>

              <th className="rn-right">Valor Contrato</th>

              <th className="rn-right">Dias Atraso</th>

              <th className="rn-right">Taxa %</th>

              <th className="rn-right">Total Devido</th>

            </tr>

          </thead>

          <tbody>

            {lista.map((c) => {

              const taxaValor =

                taxasEdicao[c.idContrato] !== undefined

                  ? taxasEdicao[c.idContrato]

                  : (Number(c.taxa) || 0).toFixed(2);



              return (

                <tr

                  key={c.idContrato}

                  style={{ opacity: c.ehAjuizado ? 0.55 : 1 }}

                >

                  <td>

                    <input

                      type="checkbox"

                      checked={selecionados.includes(c.idContrato)}

                      onChange={() => toggleContrato(c.idContrato)}

                      disabled={c.ehAjuizado}

                      title={

                        c.ehAjuizado

                          ? "Contrato ajuizado - nao pode ser selecionado"

                          : "Selecionar contrato"

                      }

                    />

                  </td>

                  <td>

                    {Number.isFinite(c.numeroContrato)

                      ? c.numeroContrato

                      : "-"}

                    {c.ehAjuizado && (

                      <span

                        className="rn-chip-status st-prej"

                        style={{ marginLeft: 8 }}

                      >

                        Ajuizado

                      </span>

                    )}

                  </td>

                  <td>{c.tipoContrato || "-"}</td>

                  <td>{c.submodalidade || "-"}</td>

                  <td className="rn-right">{fmtBRL(c.valorContrato)}</td>

                  <td className="rn-right">{c.diasAtraso}</td>



                  {/* TAXA */}

                  <td className="rn-right">

                    {isContratoEspecial(c) ? (

                      <input

                        className="rn-input rn-input-money"

                        style={{

                          textAlign: "right",

                          height: 30,

                          padding: "4px 8px",

                          background: "#0a1426",

                          borderColor: "var(--divider)",

                          width: 90,

                        }}

                        value={taxaValor}

                        onChange={(e) =>

                          handleChangeTaxaInput(c.idContrato, e.target.value)

                        }

                        onBlur={() => handleBlurTaxaInput(c)}

                        onFocus={(e) => {

                          requestAnimationFrame(() => e.target.select());

                        }}

                        inputMode="decimal"

                        title="Edite a taxa de juros (confirme no SISBR)"

                        placeholder="0,00"

                      />

                    ) : (

                      `${(Number(c.taxa) || 0).toFixed(2)}%`

                    )}

                  </td>



                  {/* TOTAL DEVIDO */}

                  <td className="rn-right">

                    {editandoTotalGeral ||

                    isContratoEspecial(c) ||

                    (c.numeroContrato === -1 && !c.ehPrejuizo) ? (

                      <input

                        className="rn-input rn-input-money"

                        style={{

                          textAlign: "right",

                          height: 30,

                          padding: "4px 8px",

                          background: "#0a1426",

                          borderColor: "var(--divider)",

                          width: 180,

                        }}

                        value={fmtBRL(c.totalDevido)}

                        onChange={(e) =>

                          atualizarSaldoContrato(c.idContrato, e.target.value)

                        }

                        onFocus={(e) => {

                          requestAnimationFrame(() => e.target.select());

                        }}

                        inputMode="numeric"

                        title="Informe o total devido atualizado (confirme no SISBR)"

                        placeholder="R$ 0,00"

                      />

                    ) : (

                      fmtBRL(c.totalDevido)

                    )}

                  </td>

                </tr>

              );

            })}

          </tbody>

        </table>

      </div>

    );

  }



  // ===============================

  // RESUMOS POR SECAO

  // ===============================

  const sumValor = (arr) =>

    arr.reduce((s, c) => s + (Number(c.totalDevido) || 0), 0);



  const resumo = {

    atrasados: {

      count: contratosAtrasados.length,

      total: sumValor(contratosAtrasados),

    },

    emDia: {

      count: contratosEmDia.length,

      total: sumValor(contratosEmDia),

    },

    prejuizo: {

      count: contratosPrejuizo.length,

      total: sumValor(contratosPrejuizo),

    },

  };



  const totalGeral = sumValor(contratos);



  // ===============================

  // RENDER

  // ===============================

  return (

    <div className="rn-container">

      <div className="rn-header">

        {/* LOGO ESQUERDA */}

        <div className="rn-title-wrapper">

          <img

            src="/recoopera-completo.png"

            alt="Recoopera"

            className="rn-logo"

          />

        </div>

      </div>



      {(cliente.nome || cpfPesquisado) && (

        <div className="rn-card" style={{ marginBottom: 16, padding: 14 }}>

          <div

            style={{

              display: "flex",

              gap: 12,

              alignItems: "center",

              flexWrap: "wrap",

            }}

          >

            <span className="rn-chip">

              <strong>Cliente:</strong>&nbsp;

              {cliente.nome ? cliente.nome : "-"}

            </span>



            <span className="rn-chip">

              <strong>Documento:</strong>&nbsp;

              {cpfCnpjExibido || "-"}

            </span>



            <span className="rn-chip">

              <strong>Contratos:</strong>&nbsp;

              {contratos.length}

            </span>

          </div>

        </div>

      )}



      <div className="rn-grid">

        {/* COLUNA ESQUERDA */}

        <div className="rn-card">

          <div className="rn-row">

            <div>

              <div className="rn-label">CPF ou CNPJ</div>

              <div style={{ position: "relative" }} className="sugestoes-container">

                <input

                  className="rn-input"

                  value={cpf}

                  onChange={(e) => {

                    const novoValor = e.target.value;

                    setCpf(novoValor);

                    

                    // Se ja tiver contratos e o usuario mudar o texto, fecha sugestÃµes

                    if (contratos.length > 0) {

                      setMostrarSugestoes(false);

                      setSugestoes([]);

                    }

                    // Se nao tiver contratos e estiver digitando nome (numeros+letras), permite reabrir

                    else if (contratos.length === 0 && novoValor.length >= 3 && !/^\d+$/.test(novoValor)) {

                      // As sugestÃµes vao reabrir automaticamente pelo debounce

                    }

                  }}

                  onKeyDown={onKeyDownCpf}

                  onFocus={() => {

                    // So abre sugestÃµes se nao tiver contratos carregados e nao estiver selecionando

                    if (contratos.length === 0 && !selecionandoSugestao && cpf.length >= 3 && !/^\d+$/.test(cpf)) {

                      setMostrarSugestoes(true);

                    }

                  }}

                  onBlur={() => {

                    // So fecha se nao estiver carregando (evita fechar durante busca)

                    if (!loading) {

                      setTimeout(() => setMostrarSugestoes(false), 150);

                    }

                  }}

                  placeholder="Digite CPF, CNPJ ou Nome do Associado"

                />

                

                {/* Lista de Sugestões */}

                {mostrarSugestoes && (

                  <div

                    style={{

                      position: "absolute",

                      top: "100%",

                      left: 0,

                      right: 0,

                      background: "var(--color-bg-card)",

                      border: "1px solid var(--color-border-input)",

                      borderTop: "none",

                      borderRadius: "0 0 10px 10px",

                      maxHeight: "200px",

                      overflowY: "auto",

                      zIndex: 1000,

                      boxShadow: "0 4px 12px rgba(0,0,0,0.15)"

                    }}

                  >

                    {buscandoSugestoes ? (

                      <div style={{ padding: "12px", color: "var(--color-text-label)" }}>

                        Buscando...

                      </div>

                    ) : sugestoes.length > 0 ? (

                      sugestoes.map((sugestao, index) => (

                        <div

                          key={index}

                          style={{

                            padding: "10px 16px",

                            borderBottom: "1px solid var(--divider)",

                            cursor: "pointer",

                            transition: "background 0.2s",

                          }}

                          onClick={(e) => {

                            e.preventDefault();

                            e.stopPropagation();

                            

                            // Impede multiplos cliques na mesma sugestao

                            if (sugestaoSelecionada === sugestao.cpfCnpj) {

                              return;

                            }

                            

                            setSugestaoSelecionada(sugestao.cpfCnpj);

                            setSelecionandoSugestao(true);

                            setCpf(sugestao.nome);

                            setMostrarSugestoes(false);

                            setSugestoes([]);

                            

                            // Limpa estados anteriores

                            setContratos([]);

                            setSelecionados([]);

                            setErro("");

                            

                            // Busca os contratos do associado selecionado

                            buscarContratosPorNome(sugestao.nome, sugestao.cpfCnpj)

                              .finally(() => {

                                setSelecionandoSugestao(false);

                              });

                          }}

                          onMouseEnter={(e) => {

                            e.target.style.background = "rgba(37,99,235,0.1)";

                          }}

                          onMouseLeave={(e) => {

                            e.target.style.background = "transparent";

                          }}

                        >

                          <div style={{ fontWeight: "bold", color: "var(--color-text-main)" }}>

                            {sugestao.nome}

                          </div>

                          <div style={{ fontSize: "12px", color: "var(--color-text-label)", marginTop: "2px" }}>

                            CPF: {maskCpfCnpj(sugestao.cpfCnpj)}

                          </div>

                        </div>

                      ))

                    ) : (

                      <div style={{ padding: "12px", color: "var(--color-text-label)" }}>

                        Nenhum associado encontrado

                      </div>

                    )}

                  </div>

                )}

              </div>

            </div>

            <div

              style={{

                display: "flex",

                alignItems: "flex-end",

                gap: 8,

              }}

            >

              <button

                className="rn-button primary"

                style={{ width: 160, height: 42 }}

                onClick={buscar}

                disabled={loading}

                title="Buscar contratos"

              >

                {loading ? "Buscando..." : "Buscar"}

              </button>

              <button

                className="rn-button"

                style={{ height: 42 }}

                onClick={() => {

                  setCpf("");

                  setContratos([]);

                  setSelecionados([]);

                  setErro("");

                  setTaxaResumoInput("");

                  setEditandoMenorTaxa(false);

                  setTaxasEdicao({});

                  setEditandoTotalGeral(false);

                  setSugestaoSelecionada(null);

                }}

                title="Limpar"

              >

                Limpar

              </button>

            </div>

          </div>



          {erro && (

            <div className="rn-section">

              <div className="rn-alert">{erro}</div>

            </div>

          )}



          <div className="rn-section">

            <div className="rn-row">

              <div>

                <div className="rn-label">Atrasados</div>

                <div className="rn-value">

                  {resumo.atrasados.count}{" "}

                  <span className="rn-badge" style={{ marginLeft: 8 }}>

                    {fmtBRL(resumo.atrasados.total)}

                  </span>

                </div>

              </div>

              <div>

                <div className="rn-label">Em Dia</div>

                <div className="rn-value">

                  {resumo.emDia.count}{" "}

                  <span className="rn-badge" style={{ marginLeft: 8 }}>

                    {fmtBRL(resumo.emDia.total)}

                  </span>

                </div>

              </div>

              <div>

                <div className="rn-label">Prejuizo</div>

                <div className="rn-value">

                  {resumo.prejuizo.count}{" "}

                  <span className="rn-badge" style={{ marginLeft: 8 }}>

                    {fmtBRL(resumo.prejuizo.total)}

                  </span>

                </div>

              </div>

              <div>

                <div

                  className="rn-label"

                  style={{

                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    gap: 8,

                  }}

                >

                  <span>Total (todos os contratos)</span>

                  <button

                    type="button"

                    className="rn-button"

                    style={{

                      padding: "4px 8px",

                      fontSize: 11,

                      height: 26,

                    }}

                    onClick={() =>

                      setEditandoTotalGeral((prev) => !prev)

                    }

                    disabled={contratos.length === 0}

                    title="Habilitar edicao do Total Devido de cada contrato"

                  >

                    {editandoTotalGeral ? "Concluir edicao" : "Editar totais"}

                  </button>

                </div>

                <div className="rn-value">{fmtBRL(totalGeral)}</div>

                {editandoTotalGeral && (

                  <div

                    className="rn-small"

                    style={{

                      marginTop: 6,

                      color: "#fca5a5",

                      fontSize: 11,

                    }}

                  >

                    Modo edicao ativo: atualize o{" "}

                    <strong>Total Devido</strong> em cada contrato e

                    confirme os valores no SISBR.

                  </div>

                )}

              </div>

            </div>

          </div>



          {/* TABELAS */}

          <div className="rn-section">

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 8,

                marginBottom: 8,

              }}

            >

              <span className="rn-chip-status st-atraso">

                1 - Contratos Atrasados

              </span>

            </div>

            {renderTabela(contratosAtrasados, "Atrasados")}

          </div>



          <div className="rn-section">

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 8,

                marginBottom: 8,

              }}

            >

              <span className="rn-chip-status st-prej">

                2 - Contratos em Prejuizo

              </span>

            </div>

            {renderTabela(contratosPrejuizo, "Prejuizo")}

          </div>



          <div className="rn-section">

            <div

              style={{

                display: "flex",

                alignItems: "center",

                gap: 8,

                marginBottom: 8,

              }}

            >

              <span className="rn-chip-status st-dia">

                3 - Contratos em Dia

              </span>

            </div>

            {renderTabela(contratosEmDia, "Em Dia")}

          </div>

        </div>



        {/* COLUNA DIREITA - RESUMO & ACOES */}

        <div className="rn-card">

          <div className="rn-label">Resumo da Selecao</div>



          {hasContratoEspecialSelecionado && (

            <div

              style={{

                marginTop: 8,

                marginBottom: 12,

                padding: "8px 10px",

                borderRadius: 8,

                background: "#450a0a",

                border: "1px solid #b91c1c",

                color: "#fecaca",

                fontSize: 12,

              }}

            >

              Aviso: Voce possui contratos em <strong>prejuizo</strong> ou com

              <strong> taxa 0 / 2,98</strong>. Confirme o valor da quitacao no

              SISBR e edite a <strong>taxa</strong> e o{" "}

              <strong>total devido</strong> se necessario.

            </div>

          )}



          {hasContratoTaxaBaixa && (

            <div

              style={{

                marginBottom: 12,

                padding: "8px 10px",

                borderRadius: 8,

                background: "#451a0a",

                border: "1px solid #b91c1c",

                color: "#fed7aa",

                fontSize: 12,

              }}

            >

              Aviso: Ha contratos com <strong>taxa abaixo de 1,00% a.m.</strong>{" "}

              Esses contratos podem ter <strong>taxa adicional de SELIC</strong>.

              Confirme as condicoes no <strong>SISBR</strong> e edite o{" "}

              <strong>total devido</strong> dos contratos, se necessario.

            </div>

          )}



          <div className="rn-row">

            <div>

              <div className="rn-label">Qtd Selecionada</div>

              <div className="rn-value">{contratosSelecionados.length}</div>

            </div>



            <div>

              <div

                className="rn-label"

                style={{

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "space-between",

                  gap: 8,

                }}

              >

                <span>Menor Taxa (entre selecionados)</span>

                <button

                  type="button"

                  className="rn-button"

                  style={{

                    padding: "4px 8px",

                    fontSize: 11,

                    height: 26,

                  }}

                  onClick={() => {

                    if (!editandoMenorTaxa) {

                      setTaxaResumoInput(

                        menorTaxa > 0 ? menorTaxa.toFixed(2) : ""

                      );

                    } else {

                      setTaxaResumoInput("");

                    }

                    setEditandoMenorTaxa((prev) => !prev);

                  }}

                  disabled={contratosSelecionados.length === 0}

                  title="Editar menor taxa para contratos selecionados"

                >

                  {editandoMenorTaxa ? "Cancelar" : "Editar"}

                </button>

              </div>



              {contratosSelecionados.length === 0 ? (

                <div className="rn-value">-</div>

              ) : editandoMenorTaxa ? (

                <input

                  className="rn-input rn-input-money"

                  style={{

                    height: 34,

                    maxWidth: 130,

                    fontVariantNumeric: "tabular-nums",

                    textAlign: "right",

                  }}

                  value={taxaResumoInput}

                  onChange={(e) => setTaxaResumoInput(e.target.value)}

                  onBlur={(e) => {

                    const raw = (e.target.value ?? "").trim();



                    // Se apagou tudo, volta pro valor atual (nao altera contratos)

                    if (raw === "") {

                      setTaxaResumoInput("");

                      setEditandoMenorTaxa(false);

                      return;

                    }



                    const texto = raw

                      .replace(",", ".")

                      .replace(/[^\d.]/g, "");

                    const novaTaxa = parseFloat(texto);



                    if (!Number.isFinite(novaTaxa)) {

                      setTaxaResumoInput("");

                      setEditandoMenorTaxa(false);

                      return;

                    }



                    // Aplica a taxa para TODOS contratos selecionados

                    setContratos((prev) =>

                      prev.map((c) =>

                        selecionados.includes(c.idContrato)

                          ? { ...c, taxa: novaTaxa }

                          : c

                      )

                    );



                    setTaxaResumoInput(novaTaxa.toFixed(2));

                    setEditandoMenorTaxa(false);

                  }}

                  placeholder={`${menorTaxa.toFixed(2)}%`}

                  inputMode="decimal"

                  title="Edite a menor taxa para contratos selecionados"

                />

              ) : (

                <div className="rn-value">{`${menorTaxa.toFixed(2)}%`}</div>

              )}

            </div>

          </div>



          <div className="rn-section">

            <div className="rn-label">Saldo Total para Negociacao</div>

            <div className="rn-value" style={{ fontSize: 22 }}>

              {fmtBRL(totalSelecionado)}

            </div>

          </div>



          <div className="rn-divider" />



          <div style={{ display: "flex", gap: 10 }}>

            <button

              className="rn-button primary"

              onClick={simularNegociacao}

              disabled={contratosSelecionados.length === 0}

              title={

                contratosSelecionados.length === 0

                  ? "Selecione contratos para simular"

                  : "Ir para simulacao"

              }

              style={{ flex: 1 }}

            >

              Simular Negociacao

            </button>

            <button

              className="rn-button warn"

              onClick={() => {

                setSelecionados([]);

                setTaxaResumoInput("");

                setEditandoMenorTaxa(false);

                setTaxasEdicao({});

              }}

              disabled={selecionados.length === 0}

              title="Limpar selecao"

            >

              Limpar selecao

            </button>

          </div>



          <div className="rn-section">

            <div

              className="rn-alert"

              style={{ borderLeftColor: "#2563eb", color: "#c7dbff" }}

            >

              Dica: voce pode marcar/desmarcar todos dentro de cada secao usando

              o checkbox no cabecalho da tabela.

            </div>

          </div>

        </div>

      </div>

    </div>

  );

}







