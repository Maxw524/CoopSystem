import { useState, useMemo } from "react";
import jsPDF from "jspdf";
import Entrevista from "../components/Entrevista";
import { useEntrevista } from "../hooks/useEntrevista";

// Estrutura de dados de documentos por tipo de cadastro.
// Cada documento tem: id, nome, obrigatorio, temVariacoes, variacoes (array), permiteTodos.
// Se temVariacoes=false, exibe apenas checkbox.
// Se permiteTodos=true, adiciona opção "Todos" no select.
const documentosPorTipoCadastro = {
  PR: [
    {
      id: "telefone",
      nome: "Telefone para contato",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "email",
      nome: "E-mail",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "inscricao_produtor",
      nome: "Inscrição de Produtor Rural (atualizado no site do Sintegra)",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "doc_identificacao",
      nome: "Documento de Identificação (colorido)",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: true,
      variacoes: [
        "Carteira ou cédula de identidade expedida pelos órgãos de segurança pública dos estados ou do Distrito Federal",
        "Registro Único de Identidade Civil (RIC)",
        "Carteira de identidade profissional expedida por repartições públicas ou por órgãos de classe de profissionais liberais",
        "Carteira de identidade militar, expedida pelas Forças Armadas ou forças auxiliares",
        "Carteira Nacional de Habilitação (CNH) – física ou digital",
        "Passaporte emitido no Brasil",
        "Carteira de Trabalho e Previdência Social (CTPS), exceto a digital",
        "Certidão de nascimento (no caso de menor)",
        "Guia de acolhimento (no caso de menor sob acolhimento institucional ou familiar)",
        "Cédula de Identidade de Estrangeiro (CIE), Registro Nacional de Estrangeiro (RNE) ou Carteira de Registro Nacional Migratório (CRNM)",
        "Protocolo de solicitação da Cédula de Identidade de Estrangeiro (CIE) e o protocolo de solicitação de refúgio",
      ],
    },
    {
      id: "estado_civil",
      nome: "Comprovante do Estado Civil e Regime de Bens",
      obrigatorio: false,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Certidão de casamento civil (se casado)",
        "Contrato escrito e registrado em cartório (se relacionamento com vínculo estável)",
        "Certidão de casamento com averbação do novo estado civil (se divorciado)",
        "Homologação judicial ou sentença judicial que ateste o novo estado civil (se separado)",
        "Certidão de óbito do cônjuge (se viúvo)",
      ],
    },
    {
      id: "residencia",
      nome: "Comprovante de Residência (dentro de 90 dias)",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração assinada pelo próprio cadastrado (modelo disponível na intranet)",
        "Contas de água, luz, telefone (fixo ou celular), fatura de cartão de crédito, gás ou TV por assinatura",
        "Contratos de locação, de prestação de serviços com pessoa idosa abrigada, comodato, arrendamento ou parceria agrícola",
        "Certificado de cadastro de imóvel rural (CCIR) emitido pelo INCRA",
        "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício",
        "Declaração emitida por sindicato rural, cooperativa ou associação de produtores rurais",
        "Cadastro Nacional da Agricultura Familiar (CAF)",
      ],
    },
    {
      id: "renda",
      nome: "Comprovante de Renda",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Laudo de vistoria ou avaliação da atividade agropecuária (válido por 1 ano a partir da emissão)",
        "Declaração de Ajuste Anual de Imposto de Renda (íntegra, com recibo de entrega)",
        "Cadastro Nacional de Agricultura Familiar (CAF)",
        "Bloco de notas ou nota fiscal de venda do produtor rural (menos de 12 meses)",
        "Projeto de viabilidade agropecuária (assinado por profissional técnico habilitado)",
        "Declaração emitida pela associação (últimos 12 meses, com assinaturas)",
      ],
    },
    {
      id: "semoventes",
      nome: "Semoventes",
      obrigatorio: false,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração de vacinação (ficha sanitária animal) e/ou Demonstrativo do Movimento de Gado (DMG) (dentro de 90 dias)",
      ],
    },
    {
      id: "bens_patrimonio",
      nome: "Comprovante de Bens/Patrimônio",
      obrigatorio: false,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração do Imposto de Renda (ano vigente, com recibo de entrega)",
        "Escritura ou contrato de compra e venda registrado no Cartório de Registro de Imóveis",
        "Certidão emitida por Cartório de Registro de Imóveis (mínimo: dados do imóvel e proprietários)",
        "Folha do carnê do IPTU (ano vigente)",
        "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício",
        "Certificado de cadastro de imóvel rural (INCRA)",
        "Balanço ou balancete que demonstre, separadamente, os bens imóveis",
        "Valores de Terra Nua (VTN) do ano corrente (Receita Federal)",
        "Nota fiscal de aquisição emitida há menos de 30 dias",
        "Certificado de Registro e Licenciamento de Veículo (CRLV) (ano vigente)",
        "Documento Único de Transferência de veículos (DUT) (dentro de 30 dias)",
        "ITR (de acordo com a validade no documento)",
        "CCIR (de acordo com a validade no documento)",
        "CAR",
      ],
    },
  ],
  PF: [
    {
      id: "telefone",
      nome: "Telefone para contato",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "email",
      nome: "E-mail",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "doc_identificacao",
      nome: "Documento de Identificação (colorido)",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: true,
      variacoes: [
        "Carteira ou cédula de identidade expedida pelos órgãos de segurança pública dos estados ou do Distrito Federal",
        "Registro Único de Identidade Civil (RIC)",
        "Carteira de identidade profissional expedida por repartições públicas ou por órgãos de classe de profissionais liberais",
        "Carteira de identidade militar, expedida pelas Forças Armadas ou forças auxiliares",
        "Carteira Nacional de Habilitação (CNH) – física ou digital",
        "Passaporte emitido no Brasil",
        "Carteira de Trabalho e Previdência Social (CTPS), exceto a digital",
        "Certidão de nascimento (no caso de menor)",
        "Guia de acolhimento (no caso de menor sob acolhimento institucional ou familiar)",
        "Cédula de Identidade de Estrangeiro (CIE), Registro Nacional de Estrangeiro (RNE) ou Carteira de Registro Nacional Migratório (CRNM)",
        "Protocolo de solicitação da Cédula de Identidade de Estrangeiro (CIE) e o protocolo de solicitação de refúgio",
      ],
    },
    {
      id: "estado_civil",
      nome: "Comprovante do Estado Civil e Regime de Bens",
      obrigatorio: false,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Certidão de casamento civil (se casado)",
        "Contrato escrito e registrado em cartório (se relacionamento com vínculo estável)",
        "Certidão de casamento com averbação do novo estado civil (se divorciado)",
        "Homologação judicial ou sentença judicial que ateste o novo estado civil (se separado)",
        "Certidão de óbito do cônjuge (se viúvo)",
      ],
    },
    {
      id: "residencia",
      nome: "Comprovante de Residência (dentro de 90 dias)",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração assinada pelo próprio cadastrado (modelo disponível na intranet)",
        "Contas de água, luz, telefone (fixo ou celular), fatura de cartão de crédito, gás ou TV por assinatura",
        "Contratos de locação, de prestação de serviços com pessoa idosa abrigada, comodato, arrendamento ou parceria agrícola",
        "Certificado de cadastro de imóvel rural (CCIR) emitido pelo INCRA",
        "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício",
        "Declaração emitida por sindicato rural, cooperativa ou associação de produtores rurais",
        "Cadastro Nacional da Agricultura Familiar (CAF)",
      ],
    },
    {
      id: "renda",
      nome: "Comprovante de Renda (dentro de 90 dias)",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração emitida pelo próprio cadastrado (limitado a R$ 10.000,00 mensal)",
        "Declaração de Ajuste Anual de Imposto de Renda (íntegra, com recibo de entrega)",
        "Comprovante emitido por meio da Consulta Renda Pessoa Física em Sisbr 2.0",
        "Declaração Comprobatória de Percepção de Rendimentos (Decore Eletrônica)",
        "e-Social, acompanhado do recibo de entrega protocolado eletronicamente",
        "Contracheque/holerite",
        "Carteira de Trabalho e Previdência Social (CTPS), física ou digital",
        "Demonstrativo de pagamento extraído do Portal da Transparência (servidores públicos)",
        "Extratos dos últimos 3 meses de conta de depósitos mantida em entidade do Sicoob",
        "Demonstrativo de crédito de benefício emitido via Sisbr 2.0 (INSS)",
        "Extrato de pagamento de benefícios emitido pelo INSS",
        "Pró-labore, contendo assinatura do contador",
        "Notas fiscais de prestação de serviços dos últimos 12 meses",
      ],
    },
    {
      id: "bens_patrimonio",
      nome: "Comprovante de Bens/Patrimônio",
      obrigatorio: false,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração do Imposto de Renda (ano vigente, com recibo de entrega)",
        "Escritura ou contrato de compra e venda registrado no Cartório de Registro de Imóveis",
        "Certidão emitida por Cartório de Registro de Imóveis (mínimo: dados do imóvel e proprietários)",
        "Folha do carnê do IPTU (ano vigente)",
        "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício",
        "Certificado de cadastro de imóvel rural (INCRA)",
        "Balanço ou balancete que demonstre, separadamente, os bens imóveis",
        "Valores de Terra Nua (VTN) do ano corrente (Receita Federal)",
        "Nota fiscal de aquisição emitida há menos de 30 dias",
        "Certificado de Registro e Licenciamento de Veículo (CRLV) (ano vigente)",
        "Documento Único de Transferência de veículos (DUT) (dentro de 30 dias)",
      ],
    },
  ],
  PJ: [
    {
      id: "contatos",
      nome: "Contatos",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "email",
      nome: "E-mail",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "ultima_alteracao_contratual",
      nome: "Última Alteração Contratual (consultar no site da Junta Comercial)",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "ata_estatuto",
      nome: "Última Ata e Estatuto Social (no caso de associação; todos registrados em cartório)",
      obrigatorio: false,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "cartao_cnpj",
      nome: "Cartão CNPJ",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "endereco_empresa",
      nome: "Comprovante de Endereço em nome da empresa (água, luz, boletos em geral; dentro de 90 dias)",
      obrigatorio: true,
      temVariacoes: false,
      permiteTodos: false,
    },
    {
      id: "faturamento",
      nome: "Comprovante de Faturamento",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Demonstração do Resultado do Exercício (DRE) ou Demonstração de Sobras e Perdas (DSP) do último exercício",
        "DRE/DSP emitido como resultado da Escrituração Contábil Digital (ECD)",
        "DRE/DSP emitido como resultado da Escrituração Contábil Fiscal (ECF)",
        "DRE/DSP publicado na CVM, em órgão da imprensa oficial ou no sítio da pessoa jurídica",
        "Extrato do Simples Nacional do último período de apuração (PGDAS-D)",
        "Declaração Anual Simplificada para o Microempreendedor Individual (DASN-SIMEI)",
        "Notas fiscais de prestação de serviço dos últimos 12 meses",
        "Levantamento Socioeconômico (LSE) – Sicoob Microcrédito",
        "Comprovante emitido por meio da Consulta Faturamento em Sisbr 2.0",
        "Relação de faturamento dos últimos 12 meses (modelo disponível como anexo)",
        "Previsão de faturamento dos próximos 12 meses (empresas constituídas há menos de 12 meses)",
      ],
    },
    {
      id: "bens_patrimonio",
      nome: "Comprovante de Bens/Patrimônio",
      obrigatorio: false,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "Declaração do Imposto de Renda (ano vigente, com recibo de entrega)",
        "Escritura ou contrato de compra e venda registrado no Cartório de Registro de Imóveis",
        "Certidão emitida por Cartório de Registro de Imóveis (mínimo: dados do imóvel e proprietários)",
        "Folha do carnê do IPTU (ano vigente)",
        "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício",
        "Certificado de cadastro de imóvel rural (INCRA)",
        "Balanço ou balancete que demonstre, separadamente, os bens imóveis",
        "Valores de Terra Nua (VTN) do ano corrente (Receita Federal)",
        "Nota fiscal de aquisição emitida há menos de 30 dias",
        "Certificado de Registro e Licenciamento de Veículo (CRLV) (ano vigente)",
        "Documento Único de Transferência de veículos (DUT) (dentro de 30 dias)",
      ],
    },
    {
      id: "documentos_socios_administradores",
      nome: "Documentos do(s) Sócio(s) e Administrador(es)",
      obrigatorio: true,
      temVariacoes: true,
      permiteTodos: false,
      variacoes: [
        "CPF do sócio principal",
        "RG ou CNH do sócio principal", 
        "Comprovante de endereço do sócio principal",
        "Comprovante de renda do sócio principal",
        "Certidão de casamento do sócio principal",
        "Certidão de óbito do cônjuge do sócio principal",
        "Certidão de divórcio do sócio principal",
        "Contrato de união estável do sócio principal",
        "CPF do outro sócio",
        "RG ou CNH do outro sócio",
        "Comprovante de endereço do outro sócio", 
        "Comprovante de renda do outro sócio",
        "Certidão de casamento do outro sócio",
        "Certidão de óbito do cônjuge do outro sócio",
        "Certidão de divórcio do outro sócio",
        "Contrato de união estável do outro sócio"
      ],
    },
  ],
};

export default function Checklist() {
  const [tipoCadastro, setTipoCadastro] = useState(null);
  const [entrevistaFinalizada, setEntrevistaFinalizada] = useState(false);
  const [dadosAssociado, setDadosAssociado] = useState({
    nome: "",
    cpfCnpj: "",
    observacoes: "",
  });
  const [documentosSelecionados, setDocumentosSelecionados] = useState({});
  const [mostrarResumo, setMostrarResumo] = useState(false);

  const documentosDoTipo = useMemo(
    () => documentosPorTipoCadastro[tipoCadastro] || [],
    [tipoCadastro]
  );

  function handleTipoSelect(tipo) {
    setTipoCadastro(tipo);
    setDocumentosSelecionados({});
    setMostrarResumo(false);
    setEntrevistaFinalizada(false);
  }

  function handleDadosChange(e) {
    const { name, value } = e.target;
    setDadosAssociado((prev) => ({ ...prev, [name]: value }));
  }

  function toggleDocumento(docId) {
    setDocumentosSelecionados((prev) => {
      const doc = documentosDoTipo.find(d => d.id === docId);
      if (!doc) return prev;
      
      if (doc.temVariacoes) {
        // Para documentos com variações, inicializa todas como false se não existir
        if (!prev[docId]) {
          return {
            ...prev,
            [docId]: {
              variacoes: doc.variacoes.reduce((acc, variacao) => {
                acc[variacao] = false;
                return acc;
              }, {}),
              selecionado: false
            }
          };
        }
        // Alterna o estado geral do documento
        return {
          ...prev,
          [docId]: {
            ...prev[docId],
            selecionado: !prev[docId].selecionado
          }
        };
      } else {
        // Para documentos sem variações, mantém o comportamento atual
        return {
          ...prev,
          [docId]: !prev[docId]
        };
      }
    });
  }

  function toggleVariacao(docId, variacao) {
    setDocumentosSelecionados((prev) => {
      const doc = documentosDoTipo.find(d => d.id === docId);
      if (!doc || !doc.temVariacoes) return prev;
      
      const currentState = prev[docId] || {
        variacoes: doc.variacoes.reduce((acc, v) => {
          acc[v] = false;
          return acc;
        }, {}),
        selecionado: false
      };
      
      const novasVariacoes = {
        ...currentState.variacoes,
        [variacao]: !currentState.variacoes[variacao]
      };
      
      // Verifica se pelo menos uma variação está marcada
      const temAlgumaMarcada = Object.values(novasVariacoes).some(v => v);
      
      return {
        ...prev,
        [docId]: {
          variacoes: novasVariacoes,
          selecionado: temAlgumaMarcada
        }
      };
    });
  }

  function marcarTodasVariacoes(docId) {
    setDocumentosSelecionados((prev) => {
      const doc = documentosDoTipo.find(d => d.id === docId);
      if (!doc || !doc.temVariacoes) return prev;
      
      const variacoesMarcadas = doc.variacoes.reduce((acc, variacao) => {
        acc[variacao] = true;
        return acc;
      }, {});
      
      return {
        ...prev,
        [docId]: {
          variacoes: variacoesMarcadas,
          selecionado: true
        }
      };
    });
  }

  function desmarcarTodasVariacoes(docId) {
    setDocumentosSelecionados((prev) => {
      const doc = documentosDoTipo.find(d => d.id === docId);
      if (!doc || !doc.temVariacoes) return prev;
      
      const variacoesDesmarcadas = doc.variacoes.reduce((acc, variacao) => {
        acc[variacao] = false;
        return acc;
      }, {});
      
      return {
        ...prev,
        [docId]: {
          variacoes: variacoesDesmarcadas,
          selecionado: false
        }
      };
    });
  }

  function marcarTodos() {
    const novos = {};
    documentosDoTipo.forEach((doc) => {
      if (doc.temVariacoes) {
        // Marca todas as variações como true
        const variacoesMarcadas = doc.variacoes.reduce((acc, variacao) => {
          acc[variacao] = true;
          return acc;
        }, {});
        
        novos[doc.id] = {
          variacoes: variacoesMarcadas,
          selecionado: true
        };
      } else {
        novos[doc.id] = true;
      }
    });
    setDocumentosSelecionados(novos);
  }

  function desmarcarTodos() {
    setDocumentosSelecionados({});
  }

  function gerarResumo() {
    setMostrarResumo(true);
  }

  function gerarPDF() {
    console.log("Gerando PDF...", { tipoCadastro, dadosAssociado, listaFinal });
    
    if (listaFinal.length === 0) {
      alert("Nenhum documento selecionado para gerar o PDF!");
      return;
    }
    
    const pdf = new jsPDF();
    
    // Adicionar logo
    const logoImg = new Image();
    logoImg.src = '/logo.jpg';
    
    // Esperar a imagem carregar e então gerar o PDF
    logoImg.onload = function() {
      // Cabeçalho com logo
      pdf.addImage(logoImg, 'PNG', 15, 10, 40, 20);
      
      // Título principal
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      const tituloTipo = tipoCadastro === 'PR' ? 'Cadastro: Produtor Rural' : 
                         tipoCadastro === 'PF' ? 'Cadastro: Pessoa Física' : 
                         'Cadastro: Pessoa Jurídica';
      pdf.text(tituloTipo, 65, 20);
      
      // Linha decorativa
      pdf.setDrawColor(0, 102, 204); // Azul Sicoob
      pdf.setLineWidth(0.5);
      pdf.line(15, 30, 195, 30);
      
      // Informações do checklist
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Tipo de Cadastro: ${tipoCadastro === 'PR' ? 'Produtor Rural' : tipoCadastro === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}`, 20, 40);
      pdf.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 48);
      
      if (dadosAssociado.observacoes) {
        pdf.text(`Observações: ${dadosAssociado.observacoes}`, 20, 56);
      }
      
      // Lista de documentos
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(0, 0, 0);
      pdf.text("Documentos necessários:", 20, dadosAssociado.observacoes ? 70 : 65);
      
      // Linha separadora
      pdf.setDrawColor(200, 200, 200);
      pdf.line(20, dadosAssociado.observacoes ? 75 : 70, 190, dadosAssociado.observacoes ? 75 : 70);
      
      pdf.setFontSize(11);
      let yPosition = dadosAssociado.observacoes ? 85 : 80;
      
      listaFinal.forEach((item, idx) => {
        // Verifica se precisa de nova página
        if (yPosition > 250) {
          pdf.addPage();
          // Repetir cabeçalho simplificado
          pdf.addImage(logoImg, 'PNG', 15, 10, 30, 15);
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(14);
          const tituloTipoSimplificado = tipoCadastro === 'PR' ? 'Cadastro: Produtor Rural' : 
                                         tipoCadastro === 'PF' ? 'Cadastro: Pessoa Física' : 
                                         'Cadastro: Pessoa Jurídica';
          pdf.text(tituloTipoSimplificado, 55, 18);
          pdf.setDrawColor(0, 102, 204);
          pdf.line(15, 25, 195, 25);
          yPosition = 35;
        }
        
        // Adiciona número sequencial
        const numero = `${idx + 1}.`;
        
        if (item.variacoes && item.variacoes.length > 0) {
          // Documento com variações
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(12);
          pdf.text(`${numero} ${item.nome}:`, 20, yPosition);
          yPosition += 8;
          
          // Adiciona o título "Documentos aceitos"
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(10);
          pdf.setTextColor(0, 102, 204); // Azul Sicoob
          pdf.text("   Documentos aceitos", 25, yPosition);
          yPosition += 6;
          
          // Adiciona cada variação
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(9);
          pdf.setTextColor(0, 0, 0);
          item.variacoes.forEach((variacao) => {
            const lines = pdf.splitTextToSize(`   • ${variacao}`, 165);
            
            if (yPosition + lines.length * 4 > 270) {
              pdf.addPage();
              // Repetir cabeçalho simplificado
              pdf.addImage(logoImg, 'PNG', 15, 10, 30, 15);
              pdf.setFont("helvetica", "bold");
              pdf.setFontSize(14);
              const tituloTipoSimplificado2 = tipoCadastro === 'PR' ? 'Cadastro: Produtor Rural' : 
                                             tipoCadastro === 'PF' ? 'Cadastro: Pessoa Física' : 
                                             'Cadastro: Pessoa Jurídica';
              pdf.text(tituloTipoSimplificado2, 55, 18);
              pdf.setDrawColor(0, 102, 204);
              pdf.line(15, 25, 195, 25);
              yPosition = 35;
            }
            
            lines.forEach((line) => {
              pdf.text(line, 20, yPosition);
              yPosition += 4;
            });
          });
          
          yPosition += 5; // Espaço extra entre documentos
        } else {
          // Documento sem variação
          pdf.setFont("helvetica", "normal");
          pdf.setFontSize(11);
          const lines = pdf.splitTextToSize(`${numero} ${item.nome}`, 165);
          
          if (yPosition + lines.length * 5 > 270) {
            pdf.addPage();
            // Repetir cabeçalho simplificado
            pdf.addImage(logoImg, 'PNG', 15, 10, 30, 15);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(14);
            const tituloTipoSimplificado3 = tipoCadastro === 'PR' ? 'Cadastro: Produtor Rural' : 
                                           tipoCadastro === 'PF' ? 'Cadastro: Pessoa Física' : 
                                           'Cadastro: Pessoa Jurídica';
            pdf.text(tituloTipoSimplificado3, 55, 18);
            pdf.setDrawColor(0, 102, 204);
            pdf.line(15, 25, 195, 25);
            yPosition = 35;
          }
          
          lines.forEach((line) => {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
          });
          
          yPosition += 3; // Espaço entre documentos
        }
      });
      
      // Rodapé
      const pageCount = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFont("helvetica", "italic");
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${i} de ${pageCount}`, 105, 285, { align: 'center' });
        pdf.text('Gerado por Recoopera - Sicoob Credipinho', 105, 290, { align: 'center' });
      }
      
      // Salvar PDF
      pdf.save(`checklist-${tipoCadastro}-${Date.now()}.pdf`);
    };
    
    // Se a imagem não carregar, gera PDF sem logo
    logoImg.onerror = function() {
      // Gera PDF sem logo (fallback)
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text("Checklist de Documentos", 20, 20);
      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.text(`Tipo de Cadastro: ${tipoCadastro}`, 20, 35);
      
      if (dadosAssociado.observacoes) {
        pdf.text(`Observações: ${dadosAssociado.observacoes}`, 20, 45);
      }
      
      pdf.setFontSize(14);
      pdf.text("Documentos necessários:", 20, dadosAssociado.observacoes ? 60 : 50);
      
      pdf.setFontSize(10);
      let yPosition = dadosAssociado.observacoes ? 70 : 60;
      
      listaFinal.forEach((item, idx) => {
        const numero = `${idx + 1}.`;
        
        if (item.variacoes && item.variacoes.length > 0) {
          pdf.setFont("helvetica", "bold");
          pdf.text(`${numero} ${item.nome}:`, 20, yPosition);
          yPosition += 8;
          
          pdf.setFont("helvetica", "bold");
          pdf.text("   Documentos aceitos", 20, yPosition);
          yPosition += 6;
          
          pdf.setFont("helvetica", "normal");
          item.variacoes.forEach((variacao) => {
            const lines = pdf.splitTextToSize(`   • ${variacao}`, 170);
            
            if (yPosition + lines.length * 5 > 280) {
              pdf.addPage();
              yPosition = 20;
            }
            
            lines.forEach((line) => {
              pdf.text(line, 20, yPosition);
              yPosition += 5;
            });
          });
          
          yPosition += 3;
        } else {
          pdf.setFont("helvetica", "normal");
          const lines = pdf.splitTextToSize(`${numero} ${item.nome}`, 170);
          
          if (yPosition + lines.length * 5 > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          
          lines.forEach((line) => {
            pdf.text(line, 20, yPosition);
            yPosition += 5;
          });
          
          yPosition += 3;
        }
      });
      
      pdf.save(`checklist-${tipoCadastro}-${Date.now()}.pdf`);
    };
  }

  // Monta lista final para impressão
  const listaFinal = useMemo(() => {
    const itens = [];
    
    documentosDoTipo.forEach((doc) => {
      const sel = documentosSelecionados[doc.id];
      
      if (!sel) return;
      
      if (doc.temVariacoes && sel.variacoes) {
        // Agrupa as variações sob o documento principal
        const variacoesMarcadas = [];
        Object.entries(sel.variacoes).forEach(([variacao, marcada]) => {
          if (marcada) {
            // Remove texto entre parênteses
            const nomeLimpo = variacao.replace(/\s*\([^)]*\)/g, '');
            variacoesMarcadas.push(nomeLimpo.trim());
          }
        });
        
        if (variacoesMarcadas.length > 0) {
          itens.push({
            nome: doc.nome.replace(/\s*\([^)]*\)/g, '').trim(),
            variacoes: variacoesMarcadas
          });
        }
      } else if (!doc.temVariacoes && sel) {
        // Documentos sem variação - remove parênteses se existir
        const nomeLimpo = doc.nome.replace(/\s*\([^)]*\)/g, '');
        itens.push({
          nome: nomeLimpo.trim(),
          variacoes: null
        });
      }
    });
    
    return itens;
  }, [documentosSelecionados, documentosDoTipo]);

  if (mostrarResumo) {
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: 20 }}>
      <h2 style={{ marginBottom: 24, color: "var(--color-text-main)" }}>Resumo do Checklist</h2>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Dados do Checklist</div>
          <p><strong>Tipo de Cadastro:</strong> {tipoCadastro}</p>
          {dadosAssociado.observacoes && <p><strong>Observações:</strong> {dadosAssociado.observacoes}</p>}
        </div>
        
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Documentos Selecionados</div>
          <div style={{ paddingLeft: 20, lineHeight: 1.6 }}>
            {listaFinal.map((item, idx) => (
              <div key={idx} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: "bold", color: "var(--color-text-main)", marginBottom: 4 }}>
                  {idx + 1}. {item.nome}
                </div>
                {item.variacoes && item.variacoes.length > 0 && (
                  <div style={{ marginLeft: 20, color: "var(--color-text-muted)" }}>
                    {item.variacoes.map((variacao, vIdx) => (
                      <div key={vIdx} style={{ marginBottom: 2 }}>
                        • {variacao}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {listaFinal.length === 0 && <p>Nenhum documento selecionado.</p>}
        </div>
        
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button className="rn-button primary" onClick={gerarPDF} style={{ padding: "12px 24px", fontSize: 15, marginRight: 12 }}>
            Gerar PDF
          </button>
          <button
            className="rn-button"
            onClick={() => setMostrarResumo(false)}
            style={{ padding: "12px 24px", fontSize: 15 }}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // Se não selecionou tipo ainda, mostrar seleção
  if (!tipoCadastro) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20 }}>
      <h1 style={{ color: "var(--color-text-main)", textAlign: "center", marginBottom: 40 }}>Check List Cadastro</h1>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20, marginBottom: 40 }}>
          <div
            onClick={() => handleTipoSelect("PR")}
            style={{
              padding: 40,
              border: "2px solid var(--color-border-input)",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "center",
              background: "var(--color-bg-card)",
              transition: "all 0.3s ease",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--color-primary)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "var(--color-border-input)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>🚜</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "var(--color-text-main)" }}>Produtor Rural</div>
            <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 8 }}>Cadastro para produtores rurais</div>
          </div>
          
          <div
            onClick={() => handleTipoSelect("PF")}
            style={{
              padding: 40,
              border: "2px solid var(--color-border-input)",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "center",
              background: "var(--color-bg-card)",
              transition: "all 0.3s ease",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--color-primary)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "var(--color-border-input)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>👤</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "var(--color-text-main)" }}>Pessoa Física</div>
            <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 8 }}>Cadastro para pessoas físicas</div>
          </div>
          
          <div
            onClick={() => handleTipoSelect("PJ")}
            style={{
              padding: 40,
              border: "2px solid var(--color-border-input)",
              borderRadius: 12,
              cursor: "pointer",
              textAlign: "center",
              background: "var(--color-bg-card)",
              transition: "all 0.3s ease",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = "var(--color-primary)";
              e.target.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = "var(--color-border-input)";
              e.target.style.transform = "translateY(0)";
            }}
          >
            <div style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>🏢</div>
            <div style={{ fontSize: 18, fontWeight: "bold", color: "var(--color-text-main)" }}>Pessoa Jurídica</div>
            <div style={{ fontSize: 14, color: "var(--color-text-muted)", marginTop: 8 }}>Cadastro para empresas</div>
          </div>
        </div>
      </div>
    );
  }

  // Se a entrevista não foi finalizada, mostrar o componente de entrevista
  if (!entrevistaFinalizada) {
    return (
      <Entrevista
        tipo={tipoCadastro}
        onFinalizar={(resultado) => {
          if (resultado.bloquear) {
            const mensagem = tipoCadastro === 'PR' 
              ? "Não é possível abrir conta com pendência no nome do CNPJ do produtor."
              : tipoCadastro === 'PF'
              ? "Não é possível abrir conta com pendência no nome do CPF."
              : "Não é possível abrir conta com pendência no nome do CNPJ.";
            alert(mensagem);
            setTipoCadastro(null);
            return;
          }

          // ativa documentos automaticamente com base nas respostas da entrevista
          setDocumentosSelecionados(resultado.documentos);
          setEntrevistaFinalizada(true);
        }}
      />
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: 20 }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: 30,
        padding: "20px 0",
        borderBottom: "2px solid var(--color-border-input)"
      }}>
        <div>
            <h1 style={{ color: "var(--color-text-main)", margin: 0, fontSize: 24 }}>Check List Cadastro</h1>
          <div style={{ color: "var(--color-text-muted)", marginTop: 4 }}>Tipo: <strong>{tipoCadastro === 'PR' ? 'Produtor Rural' : tipoCadastro === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'}</strong></div>
        </div>
        <button
          className="rn-button"
          onClick={() => {
            setTipoCadastro(null);
            setDocumentosSelecionados({});
            setMostrarResumo(false);
            setEntrevistaFinalizada(false);
          }}
          style={{ padding: "10px 20px" }}
        >
          ← Voltar para seleção
        </button>
      </div>


      {/* Lista de Documentos - Ocupando largura total */}
      <div className="card" style={{ padding: 25 }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 20,
          paddingBottom: 15,
          borderBottom: "1px solid var(--color-border-input)"
        }}>
          <div className="card-title" style={{ fontSize: 16 }}>📄 Documentos Necessários ({documentosDoTipo.length} itens)</div>
          <div>
            <button className="rn-button" onClick={marcarTodos} style={{ padding: "8px 16px", fontSize: 12, borderRadius: 6 }}>
              ✓ Marcar todos
            </button>
            <button className="rn-button" onClick={desmarcarTodos} style={{ padding: "8px 16px", fontSize: 12, borderRadius: 6, marginLeft: 8 }}>
              ✗ Desmarcar todos
            </button>
          </div>
        </div>

        {/* Alerta para o atendente */}
        <div style={{ 
          marginBottom: 20, 
          padding: 16, 
          backgroundColor: "#fff3cd", 
          border: "1px solid #ffeaa7", 
          borderRadius: 8,
          display: "flex",
          alignItems: "center",
          gap: 12
        }}>
          <div style={{ fontSize: 20, color: "#f39c12" }}>⚠️</div>
          <div>
            <div style={{ fontWeight: "bold", color: "#856404", marginBottom: 4 }}>
              Lembrete para o Atendente
            </div>
            <div style={{ color: "#856404", fontSize: 14 }}>
              Não se esqueça de verificar/atualizar a <strong>foto do associado</strong> no sistema antes de finalizar o cadastro.
            </div>
          </div>
        </div>

        <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 12 }}>
          {documentosDoTipo.map((doc) => {
            const selecionado = documentosSelecionados[doc.id];
            return (
              <div key={doc.id} style={{ 
                marginBottom: 20, 
                padding: 16,
                border: selecionado?.selecionado || selecionado ? "2px solid var(--color-primary)" : "1px solid var(--color-border-input)",
                borderRadius: 10,
                background: selecionado?.selecionado || selecionado ? "var(--color-bg-hover)" : "var(--color-bg-card)",
                transition: "all 0.2s ease"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: doc.temVariacoes ? 12 : 0 }}>
                  <input
                    type="checkbox"
                    checked={!!selecionado}
                    onChange={() => toggleDocumento(doc.id)}
                    style={{ cursor: "pointer", minWidth: 18, minHeight: 18 }}
                  />
                  <label style={{ cursor: "pointer", flex: 1, fontWeight: doc.obrigatorio ? "bold" : "normal", fontSize: 14 }}>
                    {doc.obrigatorio && <span style={{ color: "var(--color-primary)", marginRight: 6 }}>*</span>}
                    {doc.nome}
                  </label>
                </div>

                {doc.temVariacoes && (
                  <div style={{ marginLeft: 30, marginTop: 8 }}>
                    <label style={{ fontSize: 12, opacity: 0.85, marginBottom: 10, display: "block", fontWeight: "bold", color: "var(--color-text-muted)" }}>
                      📋 Documentos aceitos
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 8 }}>
                      {doc.variacoes.map((variacao, idx) => {
                        const isChecked = selecionado?.variacoes?.[variacao] || false;
                        return (
                          <label key={idx} style={{ 
                            display: "flex", 
                            alignItems: "flex-start", 
                            gap: 10,
                            padding: 10,
                            borderRadius: 6,
                            cursor: "pointer",
                            background: isChecked ? "var(--color-primary)" : "var(--color-bg-input)",
                            color: isChecked ? "white" : "var(--color-text-main)",
                            transition: "all 0.2s ease",
                            border: isChecked ? "1px solid var(--color-primary)" : "1px solid var(--color-border-input)",
                            fontSize: 12
                          }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleVariacao(doc.id, variacao)}
                              style={{ cursor: "pointer", marginTop: 2 }}
                            />
                            <span style={{ lineHeight: 1.4 }}>
                              {variacao}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Observações */}
      <div className="card" style={{ marginTop: 20, padding: 20 }}>
        <div className="card-title" style={{ marginBottom: 15, fontSize: 14 }}>📝 Observações (opcional)</div>
        <textarea
          name="observacoes"
          value={dadosAssociado.observacoes}
          onChange={handleDadosChange}
          rows={3}
          placeholder="Adicione observações adicionais se necessário..."
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 8,
            border: "1px solid var(--color-border-input)",
            background: "var(--color-bg-input)",
            color: "var(--color-text-main)",
            resize: "vertical",
            fontSize: 14
          }}
        />
      </div>

      {/* Ações */}
      <div style={{ 
        marginTop: 30, 
        textAlign: "center",
        padding: "20px 0",
        borderTop: "2px solid var(--color-border-input)"
      }}>
        <button 
          className="rn-button primary" 
          onClick={gerarResumo} 
          style={{ 
            padding: "15px 40px", 
            fontSize: 16,
            borderRadius: 8,
            fontWeight: "bold"
          }}
        >
          📄 Gerar Checklist para PDF
        </button>
      </div>
    </div>
  );
}
