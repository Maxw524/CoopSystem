import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";

export default function SistrawtsIndicadores() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.admin === true || (user?.roles || []).includes("Admin");

  const [indicadores, setIndicadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modais
  const [showIndicadorModal, setShowIndicadorModal] = useState(false);
  const [showCategoriaModal, setShowCategoriaModal] = useState(false);
  const [showSubcategoriaModal, setShowSubcategoriaModal] = useState(false);
  const [showDetalhesModal, setShowDetalhesModal] = useState(false);
  const [detalhesIndicador, setDetalhesIndicador] = useState(null);
  const [editingIndicador, setEditingIndicador] = useState(null);
  const [editingCategoria, setEditingCategoria] = useState(null);
  const [editingSubcategoria, setEditingSubcategoria] = useState(null);

  // Forms
  const [indicadorForm, setIndicadorForm] = useState({
    nomeMeta: "",
    descricao: "",
    categoriaId: "",
    ehPercentual: true,
    quantoMaiorMelhor: true,
    metasMensais: []
  });

  const [categoriaForm, setCategoriaForm] = useState({
    nome: "",
    descricao: ""
  });

  const [subcategoriaForm, setSubcategoriaForm] = useState({
    nome: "",
    descricao: ""
  });

  const [metaForm, setMetaForm] = useState({
    ano: new Date().getFullYear(),
    mes: 1,
    valorMeta: "",
    subcategoriaId: ""
  });

  const [filtroMetaAgencia, setFiltroMetaAgencia] = useState("");
  const [filtroMetaAno, setFiltroMetaAno] = useState("");
  const [filtroMetaMes, setFiltroMetaMes] = useState("");

  const [filtroDetalhesAgencia, setFiltroDetalhesAgencia] = useState("");
  const [filtroDetalhesAno, setFiltroDetalhesAno] = useState("");
  const [filtroDetalhesMes, setFiltroDetalhesMes] = useState("");

  const [resultadoForm, setResultadoForm] = useState({
    ano: new Date().getFullYear(),
    mes: 1,
    valorResultado: "",
    subcategoriaId: ""
  });

  // Filtros
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroSubcategoria, setFiltroSubcategoria] = useState("");
  const [filtroAno, setFiltroAno] = useState("");
  const [filtroMes, setFiltroMes] = useState("");
  const [filtroMesInicio, setFiltroMesInicio] = useState("");
  const [filtroMesFim, setFiltroMesFim] = useState("");
  const [tipoPeriodo, setTipoPeriodo] = useState("unico"); // "unico" ou "intervalo"

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [indicadoresRes, categoriasRes, subcategoriasRes] = await Promise.all([
        api.get("/indicador"),
        api.get("/indicador/categorias"),
        api.get("/indicador/subcategorias")
      ]);
      setIndicadores(indicadoresRes.data);
      setCategorias(categoriasRes.data);
      setSubcategorias(subcategoriasRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar indicadores
  const indicadoresFiltrados = indicadores.filter(indicador => {
    const filtroCategoriaMatch = !filtroCategoria || indicador.categoriaId === parseInt(filtroCategoria);
    // Verificar se há metas para esta subcategoria nas metas mensais
    const filtroSubcategoriaMatch = !filtroSubcategoria || indicador.metasMensais?.some(meta => 
      meta.subcategoriaId === parseInt(filtroSubcategoria)
    );
    const filtroAnoMatch = !filtroAno || indicador.metasMensais?.some(meta => meta.ano === parseInt(filtroAno));
    const filtroMesMatch = !filtroMes || indicador.metasMensais?.some(meta => meta.mes === parseInt(filtroMes));
    
    // Debug: Logar filtro
    if (filtroSubcategoria) {
      console.log(`Filtro - Indicador: ${indicador.nomeMeta}`);
      console.log(`  - Filtro Subcategoria: ${filtroSubcategoria}`);
      console.log(`  - Metas do indicador:`, indicador.metasMensais);
      console.log(`  - Match subcategoria: ${filtroSubcategoriaMatch}`);
      console.log(`  - Resultados do indicador:`, indicador.resultadosMensais);
    }
    
    return filtroCategoriaMatch && filtroSubcategoriaMatch && filtroAnoMatch && filtroMesMatch;
  });

  const openIndicadorModal = (indicador = null) => {
    setEditingIndicador(indicador);
    // Limpar filtros de metas ao abrir o modal
    setFiltroMetaAgencia("");
    setFiltroMetaAno("");
    setFiltroMetaMes("");
    
    if (indicador) {
      // Debug: Verificar dados do indicador
      console.log("Abrindo indicador para edição:", indicador);
      console.log("Metas mensais:", indicador.metasMensais);
      console.log("Resultados mensais:", indicador.resultadosMensais);
      console.log("Estrutura completa dos resultados:", JSON.stringify(indicador.resultadosMensais, null, 2));
      
      // Combinar metas com resultados existentes (considerando subcategoria)
      const metasComResultados = (indicador.metasMensais || []).map(meta => {
        console.log(`\n=== Processando Meta ===`);
        console.log(`Meta: ${meta.ano}/${meta.mes}, Agência: ${meta.subcategoriaId}, Valor: ${meta.valorMeta}`);
        
        // Encontrar resultado correspondente (exato ou compatibilidade com null)
        const resultadoCorrespondente = indicador.resultadosMensais?.find(
          r => {
            console.log(`Verificando resultado:`, r);
            console.log(`Comparando: ${r.ano}/${r.mes}/${r.subcategoriaId} com ${meta.ano}/${meta.mes}/${meta.subcategoriaId}`);
            
            if (r.ano === meta.ano && r.mes === meta.mes && r.subcategoriaId === meta.subcategoriaId) {
              console.log("Match exato encontrado!");
              return true;
            }
            if (r.ano === meta.ano && r.mes === meta.mes && r.subcategoriaId === null) {
              console.log("Match com null encontrado!");
              return true;
            }
            return false;
          }
        );
        
        const resultadoFinal = resultadoCorrespondente;
        
        console.log(`Resultado correspondente encontrado:`, resultadoFinal);
        console.log(`Buscando resultado para: ${meta.ano}/${meta.mes}, Agência: ${meta.subcategoriaId}`);
        console.log(`Resultados disponíveis:`, indicador.resultadosMensais?.filter(r => r.ano === meta.ano && r.mes === meta.mes));
        
        const metaComResultado = {
          ...meta,
          valorResultado: resultadoFinal?.valorResultado || null,
          resultadoOriginalDoBackend: !!resultadoFinal // Marca se veio do backend
        };
        
        console.log(`Meta combinada com resultado:`, metaComResultado);
        
        return metaComResultado;
      });
      
      console.log("Metas combinadas com resultados:", metasComResultados);
      
      setIndicadorForm({
        nomeMeta: indicador.nomeMeta,
        descricao: indicador.descricao || "",
        categoriaId: indicador.categoriaId,
        ehPercentual: indicador.ehPercentual,
        quantoMaiorMelhor: indicador.quantoMaiorMelhor,
        metasMensais: metasComResultados
      });
    } else {
      setIndicadorForm({
        nomeMeta: "",
        descricao: "",
        categoriaId: "",
        ehPercentual: true,
        quantoMaiorMelhor: true,
        metasMensais: []
      });
    }
    setShowIndicadorModal(true);
  };

  const openCategoriaModal = (categoria = null) => {
    setEditingCategoria(categoria);
    if (categoria) {
      setCategoriaForm({
        nome: categoria.nome,
        descricao: categoria.descricao || ""
      });
    } else {
      setCategoriaForm({
        nome: "",
        descricao: ""
      });
    }
    setShowCategoriaModal(true);
  };

  const saveIndicador = async () => {
    try {
      // Debug: Verificar o que está sendo enviado
      console.log("Enviando indicadorForm:", indicadorForm);
      
      // Validar campos obrigatórios
      if (!indicadorForm.nomeMeta || !indicadorForm.categoriaId) {
        alert("Preencha o nome e a categoria do indicador");
        return;
      }
      
      // Validar se categoriaId é número
      const categoriaIdNumerica = parseInt(indicadorForm.categoriaId);
      if (isNaN(categoriaIdNumerica)) {
        alert("Selecione uma categoria válida");
        return;
      }
      
      // Preparar dados para envio
      const dadosParaEnviar = {
        ...indicadorForm,
        categoriaId: categoriaIdNumerica,
        metasMensais: indicadorForm.metasMensais.map(meta => ({
          ...meta,
          subcategoriaId: meta.subcategoriaId ? parseInt(meta.subcategoriaId) : null
        }))
      };
      
      console.log("Dados preparados para envio:", dadosParaEnviar);
      
      let savedIndicador;
      if (editingIndicador) {
        console.log("Atualizando indicador ID:", editingIndicador.id);
        const response = await api.put(`/indicador/${editingIndicador.id}`, dadosParaEnviar);
        savedIndicador = response.data;
      } else {
        console.log("Criando novo indicador");
        const response = await api.post("/indicador", dadosParaEnviar);
        savedIndicador = response.data;
      }
      
      console.log("Indicador salvo com sucesso:", savedIndicador);
      
      // Salvar/atualizar resultados APENAS se foram preenchidos pelo usuário no formulário
      for (const meta of indicadorForm.metasMensais) {
        // Verificar se o valorResultado foi realmente preenchido pelo usuário (não veio do backend)
        if (meta.valorResultado !== null && meta.valorResultado !== undefined && meta.valorResultado !== "" && 
            !meta.resultadoOriginalDoBackend) {
          try {
            const dadosResultado = {
              indicadorId: savedIndicador.id || editingIndicador.id,
              subcategoriaId: meta.subcategoriaId || null,
              ano: meta.ano,
              mes: meta.mes,
              valorResultado: parseFloat(meta.valorResultado)
            };
            console.log("Enviando resultado para backend:", dadosResultado);
            
            await api.put(`/indicador/${savedIndicador.id || editingIndicador.id}/resultados`, dadosResultado);
            console.log("Resultado salvo com sucesso:", meta.ano, meta.mes, meta.subcategoriaId, meta.valorResultado);
          } catch (error) {
            console.error("Erro ao salvar resultado:", error);
          }
        }
      }
      
      setShowIndicadorModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar indicador:", error);
      alert("Erro ao salvar indicador");
    }
  };

  const saveCategoria = async () => {
    try {
      if (editingCategoria) {
        await api.put(`/indicador/categorias/${editingCategoria.id}`, categoriaForm);
      } else {
        await api.post("/indicador/categorias", categoriaForm);
      }
      setShowCategoriaModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      alert("Erro ao salvar categoria");
    }
  };

  const openSubcategoriaModal = (subcategoria = null) => {
    setEditingSubcategoria(subcategoria);
    setSubcategoriaForm({
      nome: subcategoria?.nome || "",
      descricao: subcategoria?.descricao || ""
    });
    setShowSubcategoriaModal(true);
  };

  const openDetalhesModal = (indicador) => {
    setDetalhesIndicador(indicador);
    // Limpar filtros de detalhes ao abrir o modal
    setFiltroDetalhesAgencia("");
    setFiltroDetalhesAno("");
    setFiltroDetalhesMes("");
    setShowDetalhesModal(true);
  };

  const saveSubcategoria = async () => {
    try {
      if (editingSubcategoria) {
        await api.put(`/indicador/subcategorias/${editingSubcategoria.id}`, subcategoriaForm);
      } else {
        await api.post("/indicador/subcategorias", subcategoriaForm);
      }
      setShowSubcategoriaModal(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar subcategoria:", error);
      alert("Erro ao salvar subcategoria");
    }
  };

  const deleteSubcategoria = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta agência?")) return;
    
    try {
      await api.delete(`/indicador/subcategorias/${id}`);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir subcategoria:", error);
      alert("Erro ao excluir subcategoria");
    }
  };

  const deleteIndicador = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este indicador?")) return;
    
    try {
      await api.delete(`/indicador/${id}`);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir indicador:", error);
      alert("Erro ao excluir indicador");
    }
  };

  const deleteCategoria = async (id) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;
    
    try {
      await api.delete(`/indicador/categorias/${id}`);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao excluir categoria");
    }
  };

  const addMeta = () => {
    if (!metaForm.ano || !metaForm.mes || !metaForm.valorMeta) return;
    
    const novaMeta = {
      ano: parseInt(metaForm.ano),
      mes: parseInt(metaForm.mes),
      valorMeta: parseFloat(metaForm.valorMeta),
      subcategoriaId: metaForm.subcategoriaId ? parseInt(metaForm.subcategoriaId) : null
    };

    // Verificar duplicação (considerando subcategoria)
    const existe = indicadorForm.metasMensais.some(
      m => m.ano === novaMeta.ano && m.mes === novaMeta.mes && m.subcategoriaId === novaMeta.subcategoriaId
    );

    if (existe) {
      const nomeAgencia = metaForm.subcategoriaId ? 
        subcategorias.find(s => s.id === parseInt(metaForm.subcategoriaId))?.nome || "esta agência" : 
        "geral";
      alert(`Já existe uma meta para ${nomeAgencia} neste mês/ano`);
      return;
    }

    setIndicadorForm(prev => ({
      ...prev,
      metasMensais: [...prev.metasMensais, novaMeta].sort((a, b) => 
        a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes
      )
    }));

    // Limpar apenas o valor, mantendo agência, ano e mês
    setMetaForm(prev => ({
      ...prev,
      valorMeta: ""
    }));
  };

  const removeMeta = (index) => {
    setIndicadorForm(prev => ({
      ...prev,
      metasMensais: prev.metasMensais.filter((_, i) => i !== index)
    }));
  };

  const formatarValor = (valor, ehPercentual) => {
    if (ehPercentual) {
      return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
    }
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Gerar todos os meses do ano para exibição
  const getMesesAnteriores = () => {
    const meses = [];
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const anoAnterior = anoAtual - 1;
    
    // Gerar todos os meses do ano atual
    for (let i = 1; i <= 12; i++) {
      const data = new Date(anoAtual, i - 1, 1);
      meses.push({
        ano: data.getFullYear(),
        mes: data.getMonth() + 1,
        nomeMes: data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        mesAno: `${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`
      });
    }
    
    return meses;
  };

  // Calcular metas cadastradas para um indicador
  const getMetasCadastradas = (indicador) => {
    const metas = indicador.metasMensais || [];
    
    if (filtroSubcategoria) {
      // Se há filtro, contar apenas metas da subcategoria filtrada
      const filtroSubcategoriaId = parseInt(filtroSubcategoria);
      const count = metas.filter(m => m.subcategoriaId === filtroSubcategoriaId).length;
      console.log(`Metas cadastradas para ${indicador.nomeMeta} (filtro ${filtroSubcategoria}): ${count}`);
      return count;
    } else {
      // Se não há filtro, contar todas as metas
      const count = metas.length;
      console.log(`Metas cadastradas para ${indicador.nomeMeta} (sem filtro): ${count}`);
      return count;
    }
  };

  // Calcular metas realizadas para um indicador
  const getMetasRealizadas = (indicador) => {
    const resultados = indicador.resultadosMensais || [];
    
    if (filtroSubcategoria) {
      // Se há filtro, contar apenas resultados da subcategoria filtrada que têm valor diferente de zero
      const filtroSubcategoriaId = parseInt(filtroSubcategoria);
      const count = resultados.filter(r => 
        r.subcategoriaId === filtroSubcategoriaId && 
        r.valorResultado !== null && 
        r.valorResultado !== undefined && 
        r.valorResultado !== "" &&
        parseFloat(r.valorResultado) !== 0
      ).length;
      console.log(`Metas realizadas para ${indicador.nomeMeta} (filtro ${filtroSubcategoria}): ${count}`);
      return count;
    } else {
      // Se não há filtro, contar todos os resultados que têm valor diferente de zero
      const count = resultados.filter(r => 
        r.valorResultado !== null && 
        r.valorResultado !== undefined && 
        r.valorResultado !== "" &&
        parseFloat(r.valorResultado) !== 0
      ).length;
      console.log(`Metas realizadas para ${indicador.nomeMeta} (sem filtro): ${count}`);
      return count;
    }
  };

  // Calcular soma de metas e resultados por mês (Sicoob Credipinho)
  const calcularSicoobCredipinho = (indicador, ano, mes) => {
    // Buscar metas e resultados do mês específico, mas de qualquer ano
    let metasDoMes = indicador.metasMensais?.filter(m => m.mes === mes) || [];
    let resultadosDoMes = indicador.resultadosMensais?.filter(r => r.mes === mes) || [];
    
    console.log(`\n=== DEBUG calcularSicoobCredipinho ===`);
    console.log(`Indicador: ${indicador.nomeMeta}`);
    console.log(`Buscando mês: ${mes} (qualquer ano)`);
    console.log(`Metas do mês:`, metasDoMes);
    console.log(`Resultados do mês:`, resultadosDoMes);
    
    if (filtroSubcategoria) {
      // Aplicar filtro de subcategoria também no Sicoob Credipinho
      const filtroSubcategoriaId = parseInt(filtroSubcategoria);
      
      // Filtrar metas (exato)
      metasDoMes = metasDoMes.filter(m => m.subcategoriaId === filtroSubcategoriaId);
      
      // Filtrar resultados (exato ou compatibilidade com null)
      resultadosDoMes = resultadosDoMes.filter(r => 
        r.subcategoriaId === filtroSubcategoriaId || r.subcategoriaId === null
      );
      
      console.log(`Aplicando filtro subcategoria ${filtroSubcategoriaId}:`);
      console.log(`Metas filtradas:`, metasDoMes);
      console.log(`Resultados filtrados:`, resultadosDoMes);
    } else {
      // Quando não há filtro, considerar apenas metas específicas das agências
      // Ignorar metas gerais (null) para evitar duplicação
      metasDoMes = metasDoMes.filter(m => m.subcategoriaId !== null);
      resultadosDoMes = resultadosDoMes.filter(r => r.subcategoriaId !== null);
      
      console.log(`Sem filtro - considerando apenas específicos:`);
      console.log(`Metas filtradas:`, metasDoMes);
      console.log(`Resultados filtrados:`, resultadosDoMes);
    }
    
    // Para indicadores percentuais, não somar valores - retornar null para exibir resultados individuais
    if (indicador.ehPercentual) {
      console.log('Indicador é percentual - não somando valores');
      return {
        meta: null,
        resultado: null,
        ehPercentual: true,
        metasIndividuais: metasDoMes,
        resultadosIndividuais: resultadosDoMes
      };
    }
    
    // Somar metas (ignorando nulos) - apenas para indicadores não percentuais
    const somaMetas = metasDoMes.reduce((acc, meta) => {
      if (meta.valorMeta !== null && meta.valorMeta !== undefined) {
        return acc + parseFloat(meta.valorMeta);
      }
      return acc;
    }, 0);
    
    // Somar resultados (ignorando nulos) - apenas para indicadores não percentuais
    const somaResultados = resultadosDoMes.reduce((acc, resultado) => {
      if (resultado.valorResultado !== null && resultado.valorResultado !== undefined) {
        return acc + parseFloat(resultado.valorResultado);
      }
      return acc;
    }, 0);
    
    console.log(`Soma metas: ${somaMetas}, Soma resultados: ${somaResultados}`);
    console.log(`Quantidade metas: ${metasDoMes.length}, Quantidade resultados: ${resultadosDoMes.length}`);
    
    const resultadoFinal = {
      meta: somaMetas !== 0 ? somaMetas : null,
      resultado: somaResultados !== 0 || resultadosDoMes.length > 0 ? somaResultados : null,
      ehPercentual: false
    };
    
    console.log('Resultado final:', resultadoFinal);
    return resultadoFinal;
  };

  const calcularStatusMeta = (meta, resultado, ehPercentual, quantoMaiorMelhor) => {
    if (!meta || !resultado) return null;
    
    const metaValor = parseFloat(meta);
    const resultadoValor = parseFloat(resultado);
    
    if (ehPercentual) {
      return quantoMaiorMelhor ? resultadoValor >= metaValor : resultadoValor <= metaValor;
    } else {
      return quantoMaiorMelhor ? resultadoValor >= metaValor : resultadoValor <= metaValor;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <div>Carregando...</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1800, margin: "0 auto", padding: "24px" }}>
      {/* Cabeçalho */}
      <div style={{ 
        display: "flex", 
        alignItems: "baseline", 
        justifyContent: "space-between", 
        gap: 16,
        marginBottom: 32,
        paddingBottom: 20,
        borderBottom: "2px solid var(--color-border-card)"
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            color: "var(--color-text-main)", 
            fontSize: "32px", 
            fontWeight: "700",
            letterSpacing: "-0.5px"
          }}>
            📈 Indicadores 
          </h1>
          <div style={{ 
            marginTop: 8, 
            color: "var(--color-text-label)", 
            opacity: 0.8, 
            fontSize: "16px" 
          }}>
            Gestão de indicadores estratégicos e acompanhamento.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          
          
          {isAdmin && (
            <div style={{ position: "relative", display: "inline-block" }}>
              <button
                className="rn-button primary"
                onClick={() => {
                  const dropdown = document.getElementById("admin-dropdown");
                  dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
                }}
                type="button"
                style={{ 
                  padding: "12px 24px", 
                  fontSize: "14px", 
                  fontWeight: "600",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                ➕ Cadastrar
                <span style={{ fontSize: "12px" }}>▼</span>
              </button>
              
              <div 
                id="admin-dropdown"
                style={{
                  position: "absolute",
                  top: "100%",
                  right: "0",
                  marginTop: "8px",
                  background: "var(--color-bg-card)",
                  border: "1px solid var(--color-border-card)",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                  display: "none",
                  minWidth: "200px"
                }}
              >
                <button
                  onClick={() => {
                    openCategoriaModal();
                    document.getElementById("admin-dropdown").style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border-card)"
                  }}
                >
                  📁 Nova Categoria
                </button>
                <button
                  onClick={() => {
                    openCategoriaModal(); // Abrir modal para selecionar categoria existente
                    document.getElementById("admin-dropdown").style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border-card)"
                  }}
                >
                  ✏️ Editar Categoria
                </button>
                <button
                  onClick={() => {
                    openIndicadorModal();
                    document.getElementById("admin-dropdown").style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border-card)"
                  }}
                >
                  📊 Novo Indicador
                </button>
                <button
                  onClick={() => {
                    openSubcategoriaModal(); // Abrir modal para selecionar agência existente
                    document.getElementById("admin-dropdown").style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--color-border-card)"
                  }}
                >
                  🏢 Nova Agência (Subcategoria)
                </button>
                <button
                  onClick={() => {
                    openSubcategoriaModal(); // Abrir modal para selecionar agência existente
                    document.getElementById("admin-dropdown").style.display = "none";
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    border: "none",
                    background: "transparent",
                    textAlign: "left",
                    fontSize: "14px",
                    cursor: "pointer"
                  }}
                >
                  ✏️ Editar Agência
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estatísticas */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: 16, 
        marginBottom: 32 
      }}>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "var(--color-primary)" }}>
            {categorias.length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Categorias
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "rgb(34, 197, 94)" }}>
            {indicadores.length}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Indicadores
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "rgb(251, 191, 36)" }}>
            {indicadores.reduce((total, i) => total + getMetasCadastradas(i), 0)}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Metas Cadastradas
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: "700", color: "rgb(34, 197, 94)" }}>
            {indicadores.reduce((total, i) => total + getMetasRealizadas(i), 0)}
          </div>
          <div style={{ fontSize: "14px", color: "var(--color-text-label)", marginTop: 4 }}>
            Metas Realizadas
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title" style={{ fontSize: "18px", fontWeight: "600", marginBottom: 16 }}>
          🔍 Filtros
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
              Categoria
            </label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)"
              }}
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
              Agência (Subcategoria)
            </label>
            <select
              value={filtroSubcategoria}
              onChange={(e) => setFiltroSubcategoria(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)"
              }}
            >
              <option value="">Todas as agências</option>
              {subcategorias.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.nome}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
              Ano
            </label>
            <select
              value={filtroAno}
              onChange={(e) => setFiltroAno(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)"
              }}
            >
              <option value="">Todos os anos</option>
              {[...Array(5)].map((_, i) => {
                const ano = new Date().getFullYear() - 2 + i;
                return (
                  <option key={ano} value={ano}>
                    {ano}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div>
            <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
              Mês
            </label>
            <select
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 6,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)"
              }}
            >
              <option value="">Todos os meses</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2024, i, 1).toLocaleDateString("pt-BR", { month: "long" })}
                </option>
              ))}
            </select>
          </div>
          
          <div style={{ display: "flex", alignItems: "end" }}>
            <button
              className="rn-button"
              onClick={() => {
                setFiltroCategoria("");
                setFiltroSubcategoria("");
                setFiltroAno("");
                setFiltroMes("");
              }}
              style={{ padding: "8px 16px", fontSize: "14px" }}
            >
              🔄 Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Indicadores */}
      <div className="card" style={{ overflow: "hidden", marginBottom: 24 }}>
        <div className="card-title" style={{ fontSize: "18px", fontWeight: "600" }}>
          📊 Indicadores ({indicadoresFiltrados.length} de {indicadores.length})
        </div>

        {indicadores.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", opacity: 0.7 }}>
            <div style={{ fontSize: "48px", marginBottom: 16 }}>📊</div>
            <div style={{ fontSize: "18px", fontWeight: "500", marginBottom: 8 }}>
              Nenhum indicador encontrado
            </div>
            <div style={{ fontSize: "14px", opacity: 0.8 }}>
              Crie indicadores para acompanhar suas metas
            </div>
          </div>
        ) : (
          <div style={{ 
            maxHeight: "600px",
            overflowY: "auto",
            overflowX: "auto",
            border: "1px solid var(--color-border-card)",
            borderRadius: "8px"
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
              <thead>
                <tr style={{ background: "var(--color-bg-card)", borderBottom: "2px solid var(--color-border-card)" }}>
                  <th style={{ padding: "16px 8px", textAlign: "left", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "200px" }}>
                    Indicador
                  </th>
                  {getMesesAnteriores().map((mes) => (
                    <th key={mes.mesAno} style={{ padding: "16px 6px", textAlign: "center", fontWeight: "600", fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.5px", minWidth: "90px" }}>
                      <div>{mes.nomeMes.split(' ')[0]}</div>
                      <div style={{ fontSize: "10px", opacity: 0.7 }}>{mes.nomeMes.split(' ')[1]}</div>
                    </th>
                  ))}
                  <th style={{ padding: "16px 8px", textAlign: "right", fontWeight: "600", fontSize: "13px", textTransform: "uppercase", letterSpacing: "0.5px", width: "200px" }}>
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {indicadoresFiltrados.map((indicador) => (
                  <tr key={indicador.id} style={{ borderTop: "1px solid var(--color-border-card)" }}>
                    <td style={{ padding: "16px 8px", verticalAlign: "top" }}>
                      <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: 4 }}>
                        {indicador.nomeMeta}
                      </div>
                      {indicador.descricao && (
                        <div style={{ fontSize: "12px", opacity: 0.7, lineHeight: 1.4 }}>
                          {indicador.descricao}
                        </div>
                      )}
                    </td>
                    {getMesesAnteriores().map((mes) => {
                      // Debug: Verificar dados completos do indicador
                      console.log(`\n=== DADOS COMPLETOS DO INDICADOR ===`);
                      console.log(`Indicador: ${indicador.nomeMeta}`);
                      console.log(`Metas mensais:`, indicador.metasMensais);
                      console.log(`Resultados mensais:`, indicador.resultadosMensais);
                      
                      // Calcular Sicoob Credipinho para este mês anterior
                      const sicoobData = calcularSicoobCredipinho(indicador, mes.ano, mes.mes);
                      const status = !sicoobData.ehPercentual && sicoobData.meta && sicoobData.resultado ? 
                        calcularStatusMeta(sicoobData.meta, sicoobData.resultado, indicador.ehPercentual, indicador.quantoMaiorMelhor) : null;
                      
                      return (
                        <td key={mes.mesAno} style={{ padding: "16px 6px", verticalAlign: "top", textAlign: "center" }}>
                          <div style={{ fontSize: "11px", marginBottom: 4, opacity: 0.7 }}>
                            📌 Consolidado
                          </div>
                          
                          {/* Para indicadores percentuais, mostrar resultados individuais */}
                          {sicoobData.ehPercentual ? (
                            <div style={{ fontSize: "11px" }}>
                              {sicoobData.metasIndividuais?.length > 0 ? (
                                sicoobData.metasIndividuais.map((meta, index) => {
                                  const resultado = sicoobData.resultadosIndividuais?.find(
                                    r => r.subcategoriaId === meta.subcategoriaId
                                  );
                                  const subcategoria = subcategorias.find(s => s.id === meta.subcategoriaId);
                                  const statusIndividual = resultado && meta ? 
                                    calcularStatusMeta(meta.valorMeta, resultado.valorResultado, indicador.ehPercentual, indicador.quantoMaiorMelhor) : null;
                                  
                                  return (
                                    <div key={index} style={{ 
                                      marginBottom: "4px", 
                                      padding: "2px 4px", 
                                      borderRadius: "3px",
                                      background: "var(--color-bg-input)",
                                      fontSize: "10px"
                                    }}>
                                      <div style={{ fontWeight: "600", marginBottom: "1px" }}>
                                        {subcategoria?.nome || "Geral"}
                                      </div>
                                      <div style={{ color: statusIndividual ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)" }}>
                                        Res: {resultado ? formatarValor(resultado.valorResultado, true) : "-"}
                                      </div>
                                      <div style={{ color: "var(--color-primary)" }}>
                                        Meta: {formatarValor(meta.valorMeta, true)}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div style={{ fontSize: "12px", opacity: 0.5 }}>-</div>
                              )}
                            </div>
                          ) : (
                            <div>
                              {sicoobData.resultado && (
                                <div style={{ 
                                  fontSize: "12px", 
                                  fontWeight: "600",
                                  color: status ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
                                }}>
                                  Res: {formatarValor(sicoobData.resultado, indicador.ehPercentual)}
                                </div>
                              )}
                              {sicoobData.meta && (
                                <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-primary)" }}>
                                  Meta: {formatarValor(sicoobData.meta, indicador.ehPercentual)}
                                </div>
                              )}
                              {!sicoobData.meta && !sicoobData.resultado && (
                                <div style={{ fontSize: "12px", opacity: 0.5 }}>-</div>
                              )}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ padding: "16px 8px", verticalAlign: "top", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
                          <button
                            className="rn-button primary"
                            onClick={() => openDetalhesModal(indicador)}
                            style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px" }}
                          >
                            📊 Detalhes
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                className="rn-button"
                                onClick={() => openIndicadorModal(indicador)}
                                style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px" }}
                              >
                                ✏️ Editar
                              </button>
                              <button
                                className="rn-button warn"
                                onClick={() => deleteIndicador(indicador.id)}
                                style={{ padding: "6px 12px", fontSize: "12px", borderRadius: "6px" }}
                              >
                                🗑️ Excluir
                              </button>
                            </>
                          )}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      {/* Modal Categoria */}
      {showCategoriaModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowCategoriaModal(false);
          }}
        >
          <div className="card" style={{ width: "min(500px, 100%)", margin: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title">
                  {editingCategoria ? "Editar Categoria" : "Nova Categoria"}
                </div>
              </div>
              <button className="rn-button" type="button" onClick={() => setShowCategoriaModal(false)}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
              {!editingCategoria && (
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "14px", fontWeight: "500" }}>
                    Selecionar Categoria Existente
                  </label>
                  <div style={{ display: "grid", gap: 8, maxHeight: "200px", overflowY: "auto", border: "1px solid var(--color-border-input)", borderRadius: 8, padding: 8 }}>
                    {categorias.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                        Nenhuma categoria cadastrada
                      </div>
                    ) : (
                      categorias.map((cat) => (
                        <div key={cat.id} style={{
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "var(--color-bg-input)",
                          borderRadius: 6,
                          border: "1px solid transparent",
                          transition: "all 0.2s"
                        }}>
                          <div>
                            <div style={{ fontWeight: "500", color: "var(--color-text-main)" }}>
                              {cat.nome}
                            </div>
                            {cat.descricao && (
                              <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
                                {cat.descricao}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => {
                                setEditingCategoria(cat);
                                setCategoriaForm({
                                  nome: cat.nome,
                                  descricao: cat.descricao || ""
                                });
                              }}
                              className="rn-button primary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Tem certeza que deseja excluir a categoria "${cat.nome}"?`)) {
                                  try {
                                    await api.delete(`/indicador/categorias/${cat.id}`);
                                    loadData();
                                  } catch (error) {
                                    console.error("Erro ao excluir categoria:", error);
                                    alert("Erro ao excluir categoria");
                                  }
                                }
                              }}
                              className="rn-button warn"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                  {editingCategoria ? "Editar Categoria" : "Nome da Nova Categoria"}
                </label>
                <input
                  type="text"
                  value={categoriaForm.nome}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, nome: e.target.value })}
                  placeholder="Ex: Financeiro, Operacional, Qualidade"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                  Descrição (opcional)
                </label>
                <textarea
                  value={categoriaForm.descricao}
                  onChange={(e) => setCategoriaForm({ ...categoriaForm, descricao: e.target.value })}
                  placeholder="Descreva o tipo de indicadores nesta categoria"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={() => setShowCategoriaModal(false)}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="button" onClick={saveCategoria}>
                  {editingCategoria ? "Atualizar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Indicador */}
      {showIndicadorModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 1000,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowIndicadorModal(false);
          }}
        >
          <div className="card" style={{ width: "min(800px, 100%)", margin: 0, maxHeight: "90vh", overflow: "auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title">
                  {editingIndicador ? "Editar Indicador" : "Novo Indicador"}
                </div>
              </div>
              <button className="rn-button" type="button" onClick={() => setShowIndicadorModal(false)}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                    Nome da Meta
                  </label>
                  <input
                    type="text"
                    value={indicadorForm.nomeMeta}
                    onChange={(e) => setIndicadorForm({ ...indicadorForm, nomeMeta: e.target.value })}
                    placeholder="Ex: Faturamento Mensal, Taxa de Cancelamento"
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)"
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                    Categoria
                  </label>
                  <select
                    value={indicadorForm.categoriaId}
                    onChange={(e) => setIndicadorForm({ ...indicadorForm, categoriaId: e.target.value })}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: "var(--color-bg-input)",
                      color: "var(--color-text-main)"
                    }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                  Descrição (opcional)
                </label>
                <textarea
                  value={indicadorForm.descricao}
                  onChange={(e) => setIndicadorForm({ ...indicadorForm, descricao: e.target.value })}
                  placeholder="Descreva detalhadamente este indicador"
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                    Tipo do Indicador
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="radio"
                        checked={indicadorForm.ehPercentual}
                        onChange={() => setIndicadorForm({ ...indicadorForm, ehPercentual: true })}
                      />
                      <span>Percentual (%)</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="radio"
                        checked={!indicadorForm.ehPercentual}
                        onChange={() => setIndicadorForm({ ...indicadorForm, ehPercentual: false })}
                      />
                      <span>Decimal</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                    Critério de Avaliação
                  </label>
                  <div style={{ display: "flex", gap: 12 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="radio"
                        checked={indicadorForm.quantoMaiorMelhor}
                        onChange={() => setIndicadorForm({ ...indicadorForm, quantoMaiorMelhor: true })}
                      />
                      <span>Quanto maior melhor</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <input
                        type="radio"
                        checked={!indicadorForm.quantoMaiorMelhor}
                        onChange={() => setIndicadorForm({ ...indicadorForm, quantoMaiorMelhor: false })}
                      />
                      <span>Quanto menor melhor</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Metas Mensais */}
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: "14px", fontWeight: "500" }}>
                  Metas Mensais
                </label>
                
                <div style={{ background: "var(--color-bg-card)", padding: 16, borderRadius: 8, marginBottom: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "end" }}>
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: "12px" }}>Agência</label>
                      <select
                        value={metaForm.subcategoriaId}
                        onChange={(e) => setMetaForm({ ...metaForm, subcategoriaId: e.target.value })}
                        style={{
                          width: "100%",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid var(--color-border-input)",
                          background: "var(--color-bg-input)",
                          color: "var(--color-text-main)"
                        }}
                      >
                        <option value="">Selecione (opcional)</option>
                        {subcategorias.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: "12px" }}>Ano</label>
                      <input
                        type="number"
                        value={metaForm.ano}
                        onChange={(e) => setMetaForm({ ...metaForm, ano: e.target.value })}
                        min="2020"
                        max="2030"
                        style={{
                          width: "100%",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid var(--color-border-input)",
                          background: "var(--color-bg-input)",
                          color: "var(--color-text-main)"
                        }}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: "12px" }}>Mês</label>
                      <select
                        value={metaForm.mes}
                        onChange={(e) => setMetaForm({ ...metaForm, mes: e.target.value })}
                        style={{
                          width: "100%",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid var(--color-border-input)",
                          background: "var(--color-bg-input)",
                          color: "var(--color-text-main)"
                        }}
                      >
                        {[...Array(12)].map((_, i) => (
                          <option key={i + 1} value={i + 1}>
                            {new Date(2024, i, 1).toLocaleDateString("pt-BR", { month: "long" })}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: "block", marginBottom: 4, fontSize: "12px" }}>
                        Valor Meta ({indicadorForm.ehPercentual ? "%" : "decimal"})
                      </label>
                      <input
                        type="number"
                        value={metaForm.valorMeta}
                        onChange={(e) => setMetaForm({ ...metaForm, valorMeta: e.target.value })}
                        step="0.01"
                        placeholder="0.00"
                        style={{
                          width: "100%",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid var(--color-border-input)",
                          background: "var(--color-bg-input)",
                          color: "var(--color-text-main)"
                        }}
                      />
                    </div>
                    
                    <button
                      className="rn-button primary"
                      onClick={addMeta}
                      style={{ padding: "8px 16px", fontSize: "12px" }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Lista de Metas com Resultados */}
                {indicadorForm.metasMensais.length > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontSize: "12px", opacity: 0.7 }}>
                        Metas cadastradas:
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <select
                          value={filtroMetaAgencia}
                          onChange={(e) => setFiltroMetaAgencia(e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--color-border-input)",
                            background: "var(--color-bg-input)",
                            color: "var(--color-text-main)",
                            fontSize: "11px"
                          }}
                        >
                          <option value="">Todas agências</option>
                          {subcategorias.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.nome}
                            </option>
                          ))}
                        </select>
                        
                        <select
                          value={filtroMetaAno}
                          onChange={(e) => setFiltroMetaAno(e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--color-border-input)",
                            background: "var(--color-bg-input)",
                            color: "var(--color-text-main)",
                            fontSize: "11px"
                          }}
                        >
                          <option value="">Todos anos</option>
                          {[...Array(5)].map((_, i) => {
                            const ano = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={ano} value={ano}>
                                {ano}
                              </option>
                            );
                          })}
                        </select>
                        
                        <select
                          value={filtroMetaMes}
                          onChange={(e) => setFiltroMetaMes(e.target.value)}
                          style={{
                            padding: "4px 8px",
                            borderRadius: 4,
                            border: "1px solid var(--color-border-input)",
                            background: "var(--color-bg-input)",
                            color: "var(--color-text-main)",
                            fontSize: "11px"
                          }}
                        >
                          <option value="">Todos meses</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {new Date(2024, i, 1).toLocaleDateString("pt-BR", { month: "short" })}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          className="rn-button"
                          onClick={() => {
                            setFiltroMetaAgencia("");
                            setFiltroMetaAno("");
                            setFiltroMetaMes("");
                          }}
                          style={{ padding: "4px 8px", fontSize: "10px" }}
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "grid", gap: 8 }}>
                      {indicadorForm.metasMensais
                        .filter(meta => {
                          const filtroAgenciaMatch = !filtroMetaAgencia || meta.subcategoriaId === parseInt(filtroMetaAgencia);
                          const filtroAnoMatch = !filtroMetaAno || meta.ano === parseInt(filtroMetaAno);
                          const filtroMesMatch = !filtroMetaMes || meta.mes === parseInt(filtroMetaMes);
                          return filtroAgenciaMatch && filtroAnoMatch && filtroMesMatch;
                        })
                        .map((meta, indexOriginal) => {
                          const index = indicadorForm.metasMensais.findIndex(m => m === meta);
                          const status = calcularStatusMeta(
                            meta.valorMeta, 
                            meta.valorResultado, 
                            indicadorForm.ehPercentual, 
                            indicadorForm.quantoMaiorMelhor
                          );
                        
                        return (
                          <div
                            key={index}
                            style={{
                              padding: "12px",
                              background: "var(--color-bg-input)",
                              borderRadius: 6,
                              border: "1px solid var(--color-border-input)"
                            }}
                          >
                            <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center" }}>
                              <div>
                                <div style={{ fontWeight: "500", marginBottom: 4 }}>
                                  {new Date(meta.ano, meta.mes - 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                                  {meta.subcategoriaId && (
                                    <span style={{ 
                                      marginLeft: 8, 
                                      fontSize: "11px", 
                                      color: "var(--color-primary)",
                                      background: "var(--color-bg-card)",
                                      padding: "2px 6px",
                                      borderRadius: "4px"
                                    }}>
                                      {subcategorias.find(s => s.id === meta.subcategoriaId)?.nome || "Agência"}
                                    </span>
                                  )}
                                </div>
                                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                                  <span style={{ color: "var(--color-primary)", fontWeight: "600" }}>
                                    Meta: {formatarValor(meta.valorMeta, indicadorForm.ehPercentual)}
                                  </span>
                                  {meta.valorResultado !== undefined && meta.valorResultado !== null && (
                                    <span style={{ 
                                      color: status ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)",
                                      fontWeight: "600"
                                    }}>
                                      Resultado: {formatarValor(meta.valorResultado, indicadorForm.ehPercentual)}
                                      {status !== null && (
                                        <span style={{ marginLeft: 8, fontSize: "11px" }}>
                                          {status ? "✅ Bateu a meta" : "❌ Não bateu a meta"}
                                        </span>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                <input
                                  type="number"
                                  placeholder="Resultado"
                                  step="0.01"
                                  value={meta.valorResultado || ""}
                                  onChange={(e) => {
                                    const novasMetas = [...indicadorForm.metasMensais];
                                    novasMetas[index] = {
                                      ...meta,
                                      valorResultado: e.target.value ? parseFloat(e.target.value) : null,
                                      resultadoOriginalDoBackend: false // Marca que foi editado pelo usuário
                                    };
                                    setIndicadorForm(prev => ({ ...prev, metasMensais: novasMetas }));
                                  }}
                                  style={{
                                    width: "120px",
                                    padding: "4px 8px",
                                    borderRadius: 4,
                                    border: "1px solid var(--color-border-input)",
                                    background: "var(--color-bg-input)",
                                    color: "var(--color-text-main)",
                                    fontSize: "12px"
                                  }}
                                />
                                <button
                                  className="rn-button warn"
                                  onClick={() => removeMeta(index)}
                                  style={{ padding: "4px 8px", fontSize: "11px" }}
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
                <button className="rn-button" type="button" onClick={() => setShowIndicadorModal(false)}>
                  Cancelar
                </button>
                <button className="rn-button primary" type="button" onClick={saveIndicador}>
                  {editingIndicador ? "Atualizar" : "Cadastrar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Subcategoria */}
      {showSubcategoriaModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            zIndex: 1000
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubcategoriaModal(false);
          }}
        >
          <div className="card" style={{ width: "min(500px, 100%)", margin: 0 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div className="card-title">
                  {editingSubcategoria ? "Editar Agência" : "Nova Agência (Subcategoria)"}
                </div>
              </div>
              <button className="rn-button" type="button" onClick={() => setShowSubcategoriaModal(false)}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 14, display: "grid", gap: 16 }}>
              {!editingSubcategoria && (
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: "14px", fontWeight: "500" }}>
                    Selecionar Agência Existente
                  </label>
                  <div style={{ display: "grid", gap: 8, maxHeight: "200px", overflowY: "auto", border: "1px solid var(--color-border-input)", borderRadius: 8, padding: 8 }}>
                    {subcategorias.length === 0 ? (
                      <div style={{ textAlign: "center", color: "#666", padding: "20px" }}>
                        Nenhuma agência cadastrada
                      </div>
                    ) : (
                      subcategorias.map((sub) => (
                        <div key={sub.id} style={{
                          display: "flex", 
                          justifyContent: "space-between", 
                          alignItems: "center",
                          padding: "8px 12px",
                          background: "var(--color-bg-input)",
                          borderRadius: 6,
                          border: "1px solid transparent",
                          transition: "all 0.2s"
                        }}>
                          <div>
                            <div style={{ fontWeight: "500", color: "var(--color-text-main)" }}>
                              {sub.nome}
                            </div>
                            {sub.descricao && (
                              <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
                                {sub.descricao}
                              </div>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button
                              onClick={() => {
                                setEditingSubcategoria(sub);
                                setSubcategoriaForm({
                                  nome: sub.nome,
                                  descricao: sub.descricao || ""
                                });
                              }}
                              className="rn-button primary"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`Tem certeza que deseja excluir a agência "${sub.nome}"?`)) {
                                  try {
                                    await api.delete(`/indicador/subcategorias/${sub.id}`);
                                    loadData();
                                  } catch (error) {
                                    console.error("Erro ao excluir agência:", error);
                                    alert("Erro ao excluir agência");
                                  }
                                }
                              }}
                              className="rn-button warn"
                              style={{ padding: "4px 8px", fontSize: "11px" }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                  {editingSubcategoria ? "Editar Agência" : "Nome da Nova Agência"}
                </label>
                <input
                  type="text"
                  value={subcategoriaForm.nome}
                  onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, nome: e.target.value })}
                  placeholder="Ex: PA 00, PA 01, Matriz"
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "14px", fontWeight: "500" }}>
                  Descrição (opcional)
                </label>
                <textarea
                  value={subcategoriaForm.descricao}
                  onChange={(e) => setSubcategoriaForm({ ...subcategoriaForm, descricao: e.target.value })}
                  placeholder="Descrição detalhada da agência..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: 10,
                    borderRadius: 8,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    resize: "vertical"
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
              <button className="rn-button" type="button" onClick={() => setShowSubcategoriaModal(false)}>
                Cancelar
              </button>
              <button className="rn-button primary" type="button" onClick={saveSubcategoria}>
                {editingSubcategoria ? "Atualizar" : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Indicador */}
      {showDetalhesModal && detalhesIndicador && (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
                    backdropFilter: "blur(2px)",
                    WebkitBackdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 24,
          width: "95%",
          maxWidth: 1200,
          maxHeight: "90vh",
          overflowY: "auto",
          border: "1px solid var(--color-border-card)",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
        }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, marginBottom: 20 }}>
            <div>
              <div className="card-title">
                📊 Detalhes do Indicador
              </div>
              <div style={{ fontSize: "14px", opacity: 0.8, marginTop: 4 }}>
                {detalhesIndicador.nomeMeta}
              </div>
            </div>
            <button className="rn-button" type="button" onClick={() => setShowDetalhesModal(false)}>
              ✕
            </button>
          </div>

          {/* Filtros de Detalhes */}
          <div style={{
            background: "var(--color-bg-input)",
            padding: 16,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <h4 style={{ margin: "0 0 12px", color: "var(--color-primary)" }}>
              🔍 Filtros
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "12px", fontWeight: "500" }}>
                  Agência
                </label>
                <select
                  value={filtroDetalhesAgencia}
                  onChange={(e) => setFiltroDetalhesAgencia(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    fontSize: "12px"
                  }}
                >
                  <option value="">Todas as agências</option>
                  {subcategorias.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.nome}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "12px", fontWeight: "500" }}>
                  Ano
                </label>
                <select
                  value={filtroDetalhesAno}
                  onChange={(e) => setFiltroDetalhesAno(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    fontSize: "12px"
                  }}
                >
                  <option value="">Todos os anos</option>
                  {[...Array(5)].map((_, i) => {
                    const ano = new Date().getFullYear() - 2 + i;
                    return (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", marginBottom: 4, fontSize: "12px", fontWeight: "500" }}>
                  Mês
                </label>
                <select
                  value={filtroDetalhesMes}
                  onChange={(e) => setFiltroDetalhesMes(e.target.value)}
                  style={{
                    width: "100%",
                    padding: 8,
                    borderRadius: 6,
                    border: "1px solid var(--color-border-input)",
                    background: "var(--color-bg-input)",
                    color: "var(--color-text-main)",
                    fontSize: "12px"
                  }}
                >
                  <option value="">Todos os meses</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2024, i, 1).toLocaleDateString("pt-BR", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div style={{ display: "flex", alignItems: "end" }}>
                <button
                  className="rn-button"
                  onClick={() => {
                    setFiltroDetalhesAgencia("");
                    setFiltroDetalhesAno("");
                    setFiltroDetalhesMes("");
                  }}
                  style={{ padding: "8px 16px", fontSize: "12px" }}
                >
                  🔄 Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Informações Básicas */}
          <div style={{
            background: "var(--color-bg-input)",
            padding: 16,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <h4 style={{ margin: "0 0 12px", color: "var(--color-primary)" }}>
              📋 Informações Básicas
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              <div>
                <strong style={{ color: "var(--color-primary)" }}>Categoria:</strong>
                <div style={{ marginTop: 4 }}>{detalhesIndicador.categoriaNome}</div>
              </div>
              <div>
                <strong style={{ color: "var(--color-primary)" }}>Tipo:</strong>
                <div style={{ marginTop: 4 }}>
                  {detalhesIndicador.ehPercentual ? "Percentual" : "Decimal"}
                  {detalhesIndicador.quantoMaiorMelhor ? " (Quanto maior melhor)" : " (Quanto menor melhor)"}
                </div>
              </div>
              {detalhesIndicador.descricao && (
                <div style={{ gridColumn: "1 / -1" }}>
                  <strong style={{ color: "var(--color-primary)" }}>Descrição:</strong>
                  <div style={{ marginTop: 4 }}>{detalhesIndicador.descricao}</div>
                </div>
              )}
            </div>
          </div>

          {/* Dashboard - Resumo Geral */}
          <div style={{
            background: "var(--color-bg-input)",
            padding: 16,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <h4 style={{ margin: "0 0 12px", color: "var(--color-primary)" }}>
              📈 Dashboard - Resumo Geral
            </h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
              {(() => {
                // Aplicar filtros nas metas e resultados
                const metasFiltradas = detalhesIndicador.metasMensais?.filter(meta => {
                  const filtroAgenciaMatch = !filtroDetalhesAgencia || meta.subcategoriaId === parseInt(filtroDetalhesAgencia);
                  const filtroAnoMatch = !filtroDetalhesAno || meta.ano === parseInt(filtroDetalhesAno);
                  const filtroMesMatch = !filtroDetalhesMes || meta.mes === parseInt(filtroDetalhesMes);
                  return filtroAgenciaMatch && filtroAnoMatch && filtroMesMatch;
                }) || [];

                const resultadosFiltrados = detalhesIndicador.resultadosMensais?.filter(resultado => {
                  const filtroAgenciaMatch = !filtroDetalhesAgencia || resultado.subcategoriaId === parseInt(filtroDetalhesAgencia);
                  const filtroAnoMatch = !filtroDetalhesAno || resultado.ano === parseInt(filtroDetalhesAno);
                  const filtroMesMatch = !filtroDetalhesMes || resultado.mes === parseInt(filtroDetalhesMes);
                  return filtroAgenciaMatch && filtroAnoMatch && filtroMesMatch;
                }) || [];

                // Calcular totais com dados filtrados
                const totalMetas = metasFiltradas.reduce((acc, meta) => {
                  if (meta.valorMeta !== null && meta.valorMeta !== undefined) {
                    return acc + parseFloat(meta.valorMeta);
                  }
                  return acc;
                }, 0) || 0;

                const totalResultados = resultadosFiltrados.reduce((acc, resultado) => {
                  if (resultado.valorResultado !== null && resultado.valorResultado !== undefined) {
                    return acc + parseFloat(resultado.valorResultado);
                  }
                  return acc;
                }, 0) || 0;

                // Para indicadores percentuais, não somar valores - mostrar contagem
                const totalMetasDisplay = detalhesIndicador.ehPercentual 
                  ? metasFiltradas.length 
                  : totalMetas;
                const totalResultadosDisplay = detalhesIndicador.ehPercentual 
                  ? resultadosFiltrados.length 
                  : totalResultados;

                const totalAgencias = [...new Set(
                  metasFiltradas.map(meta => meta.subcategoriaId).filter(id => id != null)
                )].length;

                const totalMeses = [...new Set(
                  metasFiltradas.map(meta => `${meta.ano}/${meta.mes}`)
                )].length;

                return (
                  <>
                    <div style={{ textAlign: "center", padding: 12, background: "var(--color-bg-card)", borderRadius: 6 }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--color-primary)" }}>
                        {detalhesIndicador.ehPercentual ? totalMetasDisplay : formatarValor(totalMetasDisplay, detalhesIndicador.ehPercentual)}
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.7 }}>Total de Metas</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 12, background: "var(--color-bg-card)", borderRadius: 6 }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: totalResultadosDisplay >= totalMetasDisplay ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)" }}>
                        {detalhesIndicador.ehPercentual ? totalResultadosDisplay : formatarValor(totalResultadosDisplay, detalhesIndicador.ehPercentual)}
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.7 }}>Total de Resultados</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 12, background: "var(--color-bg-card)", borderRadius: 6 }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--color-primary)" }}>
                        {totalAgencias}
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.7 }}>Agências</div>
                    </div>
                    <div style={{ textAlign: "center", padding: 12, background: "var(--color-bg-card)", borderRadius: 6 }}>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: "var(--color-primary)" }}>
                        {totalMeses}
                      </div>
                      <div style={{ fontSize: "12px", opacity: 0.7 }}>Meses</div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Dashboard Gráfico por Agência */}
          <div>
            <h4 style={{ margin: "0 0 12px", color: "#333" }}>
              📊 Dashboard por Agência
            </h4>
            <div style={{ display: "grid", gap: 12 }}>
              {(() => {
                // Aplicar filtros nos dados antes de agrupar
                const metasFiltradas = detalhesIndicador.metasMensais?.filter(meta => {
                  const filtroAgenciaMatch = !filtroDetalhesAgencia || meta.subcategoriaId === parseInt(filtroDetalhesAgencia);
                  const filtroAnoMatch = !filtroDetalhesAno || meta.ano === parseInt(filtroDetalhesAno);
                  const filtroMesMatch = !filtroDetalhesMes || meta.mes === parseInt(filtroDetalhesMes);
                  return filtroAgenciaMatch && filtroAnoMatch && filtroMesMatch;
                }) || [];

                const resultadosFiltrados = detalhesIndicador.resultadosMensais?.filter(resultado => {
                  const filtroAgenciaMatch = !filtroDetalhesAgencia || resultado.subcategoriaId === parseInt(filtroDetalhesAgencia);
                  const filtroAnoMatch = !filtroDetalhesAno || resultado.ano === parseInt(filtroDetalhesAno);
                  const filtroMesMatch = !filtroDetalhesMes || resultado.mes === parseInt(filtroDetalhesMes);
                  return filtroAgenciaMatch && filtroAnoMatch && filtroMesMatch;
                }) || [];

                // Agrupar metas por agência
                const metasPorAgencia = {};
                
                // Agrupar metas filtradas
                metasFiltradas.forEach(meta => {
                  const chave = meta.subcategoriaId ? 
                    subcategorias.find(s => s.id === meta.subcategoriaId)?.nome || "Sem Agência" : 
                    "Geral";
                  
                  if (!metasPorAgencia[chave]) {
                    metasPorAgencia[chave] = [];
                  }
                  
                  metasPorAgencia[chave].push(meta);
                });

                // Agrupar resultados filtrados
                const resultadosPorAgencia = {};
                resultadosFiltrados.forEach(resultado => {
                  const chave = resultado.subcategoriaId ? 
                    subcategorias.find(s => s.id === resultado.subcategoriaId)?.nome || "Sem Agência" : 
                    "Geral";
                  
                  if (!resultadosPorAgencia[chave]) {
                    resultadosPorAgencia[chave] = [];
                  }
                  
                  resultadosPorAgencia[chave].push(resultado);
                });

                return Object.entries(metasPorAgencia).sort(([a], [b]) => {
                  // Ordenar: "Geral" por último, depois por nome
                  if (a === "Geral") return 1;
                  if (b === "Geral") return -1;
                  return a.localeCompare(b);
                }).map(([agencia, metas]) => {
                  const resultados = resultadosPorAgencia[agencia] || [];
                  
                  // Calcular totais por agência
                  const totalMetaAgencia = detalhesIndicador.ehPercentual 
                    ? metas.length 
                    : metas.reduce((acc, meta) => {
                        if (meta.valorMeta !== null && meta.valorMeta !== undefined) {
                          return acc + parseFloat(meta.valorMeta);
                        }
                        return acc;
                      }, 0);

                  const totalResultadoAgencia = detalhesIndicador.ehPercentual 
                    ? resultados.length 
                    : resultados.reduce((acc, resultado) => {
                        if (resultado.valorResultado !== null && resultado.valorResultado !== undefined) {
                          return acc + parseFloat(resultado.valorResultado);
                        }
                        return acc;
                      }, 0);

                  const atingiuMeta = totalResultadoAgencia >= totalMetaAgencia;
                  const percentualAtingido = totalMetaAgencia > 0 ? (totalResultadoAgencia / totalMetaAgencia) * 100 : 0;
                  
                  // Preparar dados para gráfico de barras
                  const dadosGrafico = metas
                    .sort((a, b) => {
                      if (a.ano !== b.ano) return a.ano - b.ano;
                      return a.mes - b.mes;
                    })
                    .map(meta => {
                      const resultadoCorrespondente = resultados.find(
                        r => {
                          if (r.ano === meta.ano && r.mes === meta.mes && r.subcategoriaId === meta.subcategoriaId) {
                            return true;
                          }
                          if (r.ano === meta.ano && r.mes === meta.mes && r.subcategoriaId === null) {
                            return true;
                          }
                          return false;
                        }
                      );
                      
                      return {
                        mes: new Date(meta.ano, meta.mes - 1).toLocaleDateString('pt-BR', { month: 'short' }),
                        meta: meta.valorMeta || 0,
                        resultado: resultadoCorrespondente?.valorResultado || 0
                      };
                    });
                  
                  return (
                    <div key={agencia} style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: 16,
                      background: "#ffffff",
                      boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)"
                    }}>
                      {/* Cabeçalho da Agência */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                        <div>
                          <h5 style={{ margin: 0, color: "#333", fontSize: "16px", fontWeight: "600" }}>
                            📌 {agencia}
                          </h5>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
                            {metas.length} meses registrados
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", color: "#666", marginBottom: 4 }}>
                            Desempenho Total
                          </div>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: atingiuMeta ? "#22c55e" : "#ef4444" }}>
                            {detalhesIndicador.ehPercentual ? totalResultadoAgencia : formatarValor(totalResultadoAgencia, detalhesIndicador.ehPercentual)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: 2 }}>
                            de {detalhesIndicador.ehPercentual ? totalMetaAgencia : formatarValor(totalMetaAgencia, detalhesIndicador.ehPercentual)}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <span style={{ 
                              background: atingiuMeta ? "#22c55e" : "#ef4444",
                              color: "white",
                              padding: "3px 10px",
                              borderRadius: 16,
                              fontSize: "11px",
                              fontWeight: "600"
                            }}>
                              {atingiuMeta ? "✅ Meta Batida" : "❌ Meta Não Batida"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Gráfico de Barras */}
                      <div style={{ marginBottom: 16, padding: "12px", background: "#f9fafb", borderRadius: 6 }}>
                        <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: 12, color: "#333" }}>
                          📈 Evolução Mensal
                        </div>
                        <div style={{ display: "flex", alignItems: "end", gap: 6, height: "80px", padding: "6px" }}>
                          {dadosGrafico.map((dado, index) => {
                            const maxValor = Math.max(...dadosGrafico.map(d => Math.max(dado.meta, dado.resultado)));
                            const alturaMeta = maxValor > 0 ? (dado.meta / maxValor) * 100 : 0;
                            const alturaResultado = maxValor > 0 ? (dado.resultado / maxValor) * 100 : 0;
                            
                            return (
                              <div key={index} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                                <div style={{ fontSize: "10px", color: "#666", textAlign: "center" }}>
                                  {dado.mes}
                                </div>
                                <div style={{ width: "100%", height: "60px", display: "flex", alignItems: "end", gap: 1 }}>
                                  <div style={{ 
                                    width: "45%", 
                                    height: `${alturaMeta}%`,
                                    background: "#3b82f6",
                                    borderRadius: "1px 0 0 1px",
                                    position: "relative"
                                  }}>
                                    {dado.meta > 0 && (
                                      <div style={{
                                        position: "absolute",
                                        top: "-16px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        fontSize: "8px",
                                        color: "#666",
                                        whiteSpace: "nowrap"
                                      }}>
                                        {formatarValor(dado.meta, detalhesIndicador.ehPercentual)}
                                      </div>
                                    )}
                                  </div>
                                  <div style={{ 
                                    width: "45%", 
                                    height: `${alturaResultado}%`,
                                    background: dado.resultado >= dado.meta ? "#22c55e" : "#ef4444",
                                    borderRadius: "0 1px 1px 0",
                                    position: "relative"
                                  }}>
                                    {dado.resultado > 0 && (
                                      <div style={{
                                        position: "absolute",
                                        bottom: "-16px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                        fontSize: "8px",
                                        color: "#666",
                                        whiteSpace: "nowrap"
                                      }}>
                                        {formatarValor(dado.resultado, detalhesIndicador.ehPercentual)}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 24 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: "12px", height: "12px", background: "#22c55e", borderRadius: "2px" }}></div>
                            <span style={{ fontSize: "12px", color: "#666" }}>Resultado</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: "12px", height: "12px", background: "#3b82f6", borderRadius: "2px" }}></div>
                            <span style={{ fontSize: "12px", color: "#666" }}>Meta</span>
                          </div>
                        </div>
                      </div>

                      {/* Cards de Métricas */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
                        <div style={{ padding: "12px", background: atingiuMeta ? "#f0fdf4" : "#fef2f2", borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: atingiuMeta ? "#22c55e" : "#ef4444" }}>
                            {detalhesIndicador.ehPercentual ? totalResultadoAgencia : formatarValor(totalResultadoAgencia, detalhesIndicador.ehPercentual)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>Resultado Total</div>
                        </div>
                        <div style={{ padding: "12px", background: "#f0f9ff", borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#3b82f6" }}>
                            {detalhesIndicador.ehPercentual ? totalMetaAgencia : formatarValor(totalMetaAgencia, detalhesIndicador.ehPercentual)}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>Meta Total</div>
                        </div>
                        <div style={{ padding: "12px", background: "#fef3c7", borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#f59e0b" }}>
                            {percentualAtingido.toFixed(1)}%
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>% Atingido</div>
                        </div>
                        <div style={{ padding: "12px", background: "#f3f4f6", borderRadius: 8, textAlign: "center" }}>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: "#6b7280" }}>
                            {metas.filter(m => {
                              const resultadoCorrespondente = resultados.find(
                                r => {
                                  if (r.ano === m.ano && r.mes === m.mes && r.subcategoriaId === m.subcategoriaId) return true;
                                  if (r.ano === m.ano && r.mes === m.mes && r.subcategoriaId === null) return true;
                                  return false;
                                }
                              );
                              return resultadoCorrespondente && calcularStatusMeta(m.valorMeta, resultadoCorrespondente.valorResultado, detalhesIndicador.ehPercentual, detalhesIndicador.quantoMaiorMelhor);
                            }).length}
                          </div>
                          <div style={{ fontSize: "12px", color: "#666", marginTop: 4 }}>Metas Batidas</div>
                        </div>
                      </div>

                      {/* Tabela Detalhada */}
                      <div style={{ marginTop: 20 }}>
                        <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: 12, color: "#333" }}>
                          📋 Detalhes Mensais
                        </div>
                        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                          {metas
                            .sort((a, b) => {
                              if (a.ano !== b.ano) return a.ano - b.ano;
                              return a.mes - b.mes;
                            })
                            .map(meta => {
                            const resultadoCorrespondente = resultados.find(
                              r => {
                                if (r.ano === meta.ano && r.mes === meta.mes && r.subcategoriaId === meta.subcategoriaId) return true;
                                if (r.ano === meta.ano && r.mes === meta.mes && r.subcategoriaId === null) return true;
                                return false;
                              }
                            );
                            
                            const status = resultadoCorrespondente ? 
                              calcularStatusMeta(meta.valorMeta, resultadoCorrespondente.valorResultado, detalhesIndicador.ehPercentual, detalhesIndicador.quantoMaiorMelhor) : null;
                            
                            return (
                              <div key={`${meta.ano}-${meta.mes}`} style={{
                                background: "#ffffff",
                                padding: 12,
                                borderRadius: 8,
                                border: "1px solid #e5e7eb"
                              }}>
                                <div style={{ fontSize: "12px", fontWeight: "600", marginBottom: 8, color: "#333" }}>
                                  {new Date(meta.ano, meta.mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                                  {resultadoCorrespondente && (
                                    <div>
                                      <div style={{ fontSize: "10px", color: "#666", marginBottom: 2 }}>Resultado:</div>
                                      <div style={{ 
                                        fontSize: "14px", 
                                        fontWeight: "600",
                                        color: status ? "#22c55e" : "#ef4444"
                                      }}>
                                        {formatarValor(resultadoCorrespondente.valorResultado, detalhesIndicador.ehPercentual)}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <div style={{ fontSize: "10px", color: "#666", marginBottom: 2 }}>Meta:</div>
                                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#3b82f6" }}>
                                      {formatarValor(meta.valorMeta, detalhesIndicador.ehPercentual)}
                                    </div>
                                  </div>
                                </div>
                                {status !== null && (
                                  <div style={{ marginTop: 8 }}>
                                    <span style={{ 
                                      background: status ? "#22c55e" : "#ef4444",
                                      color: "white",
                                      padding: "2px 8px",
                                      borderRadius: 12,
                                      fontSize: "10px",
                                      fontWeight: "600"
                                    }}>
                                      {status ? "✅ Batido" : "❌ Não batido"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
