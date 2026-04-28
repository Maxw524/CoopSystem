export function useEntrevista() {
  // =========================
  // HELPERS
  // =========================
  function criarGrupo(variacoes = {}) {
    return {
      selecionado: true,
      variacoes,
    };
  }

  function marcarSimples(documentos, chave) {
    documentos[chave] = true;
  }

  function marcarGrupo(documentos, chave, variacoes = {}) {
    if (!variacoes || Object.keys(variacoes).length === 0) return;

    const grupoAtual = documentos[chave];

    if (!grupoAtual || typeof grupoAtual === "boolean") {
      documentos[chave] = criarGrupo({ ...variacoes });
      return;
    }

    documentos[chave] = {
      selecionado: true,
      variacoes: {
        ...(grupoAtual.variacoes || {}),
        ...variacoes,
      },
    };
  }

  function adicionarVariacoesPorLista(lista = []) {
    const variacoes = {};
    if (!Array.isArray(lista)) return variacoes;

    lista.forEach((item) => {
      if (item && item !== "Não possui") {
        variacoes[item] = true;
      }
    });

    return variacoes;
  }

  function parseQuantidadeSocios(valor) {
    if (!valor) return 1;
    if (valor === "5 ou mais") return 5;

    const numero = parseInt(valor, 10);
    return Number.isNaN(numero) ? 1 : numero;
  }

  function estadoCivilParaVariacao(estadoCivil) {
    const mapa = {
      casado: { "Certidão de casamento civil (se casado)": true },
      uniao_estavel: {
        "Contrato escrito e registrado em cartório (se relacionamento com vínculo estável)": true,
      },
      divorciado: {
        "Certidão de casamento com averbação do novo estado civil (se divorciado)": true,
      },
      separado: {
        "Homologação judicial ou sentença judicial que ateste o novo estado civil (se separado)": true,
      },
      viuvo: { "Certidão de óbito do cônjuge (se viúvo)": true },
    };

    return mapa[estadoCivil] || {};
  }

  // =========================
  // VARIAÇÕES BASE
  // =========================
  function variacoesResidenciaPRPF() {
    return {
      "Declaração assinada pelo próprio cadastrado (modelo disponível na intranet)": true,
      "Contas de água, luz, telefone (fixo ou celular), fatura de cartão de crédito, gás ou TV por assinatura": true,
      "Contratos de locação, de prestação de serviços com pessoa idosa abrigada, comodato, arrendamento ou parceria agrícola": true,
      "Certificado de cadastro de imóvel rural (CCIR) emitido pelo INCRA": true,
      "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício": true,
      "Declaração emitida por sindicato rural, cooperativa ou associação de produtores rurais": true,
      "Cadastro Nacional da Agricultura Familiar (CAF)": true,
    };
  }

  function variacoesDocIdentificacaoPR(tipoIdentificacao) {
    if (tipoIdentificacao === "Brasileiro") {
      return {
        "Carteira ou cédula de identidade expedida pelos órgãos de segurança pública dos estados ou do Distrito Federal": true,
        "Registro Único de Identidade Civil (RIC)": true,
        "Carteira de identidade profissional expedida por repartições públicas ou por órgãos de classe de profissionais liberais": true,
        "Carteira de identidade militar, expedida pelas Forças Armadas ou forças auxiliares": true,
        "Carteira Nacional de Habilitação (CNH) – física ou digital": true,
        "Passaporte emitido no Brasil": true,
        "Carteira de Trabalho e Previdência Social (CTPS), exceto a digital": true,
        "Certidão de nascimento (no caso de menor)": true,
        "Guia de acolhimento (no caso de menor sob acolhimento institucional ou familiar)": true,
      };
    }

    return {
      "Cédula de Identidade de Estrangeiro (CIE), Registro Nacional de Estrangeiro (RNE) ou Carteira de Registro Nacional Migratório (CRNM)": true,
      "Protocolo de solicitação da Cédula de Identidade de Estrangeiro (CIE) e o protocolo de solicitação de refúgio": true,
      "Carteira Nacional de Habilitação (CNH) – física ou digital": true,
      "Carteira de Trabalho e Previdência Social (CTPS), exceto a digital": true,
      "Passaporte emitido no Brasil": true,
      "Guia de Acolhimento, emitido no Brasil, no caso de menor sob acolhimento institucional ou familiar": true,
    };
  }

  function variacoesDocIdentificacaoPF() {
    return {
      "Carteira ou cédula de identidade expedida pelos órgãos de segurança pública dos estados ou do Distrito Federal": true,
      "Registro Único de Identidade Civil (RIC)": true,
      "Carteira de identidade profissional expedida por repartições públicas ou por órgãos de classe de profissionais liberais": true,
      "Carteira de identidade militar, expedida pelas Forças Armadas ou forças auxiliares": true,
      "Carteira Nacional de Habilitação (CNH) – física ou digital": true,
      "Passaporte emitido no Brasil": true,
      "Carteira de Trabalho e Previdência Social (CTPS), exceto a digital": true,
      "Certidão de nascimento (no caso de menor)": true,
      "Guia de acolhimento (no caso de menor sob acolhimento institucional ou familiar)": true,
      "Cédula de Identidade de Estrangeiro (CIE), Registro Nacional de Estrangeiro (RNE) ou Carteira de Registro Nacional Migratório (CRNM)": true,
      "Protocolo de solicitação da Cédula de Identidade de Estrangeiro (CIE) e o protocolo de solicitação de refúgio": true,
    };
  }

  function variacoesRendaPR(tipoRenda = []) {
    const variacoes = {};

    if (!Array.isArray(tipoRenda)) return variacoes;

    tipoRenda.forEach((item) => {
      if (item.includes("Laudo de vistoria")) {
        variacoes[
          "Laudo de vistoria ou avaliação da atividade agropecuária (válido por 1 ano a partir da emissão)"
        ] = true;
      }

      if (item.includes("Declaração de IR com produção rural")) {
        variacoes[
          "Declaração de Ajuste Anual de Imposto de Renda (íntegra, com recibo de entrega)"
        ] = true;
      }

      if (item.includes("CAF")) {
        variacoes["Cadastro Nacional de Agricultura Familiar (CAF)"] = true;
      }

      if (item.includes("Bloco de produtor")) {
        variacoes[
          "Bloco de notas ou nota fiscal de venda do produtor rural emitidos há menos de 12 meses"
        ] = true;
      }

      if (item === "Notas fiscais") {
        variacoes["Notas fiscais eletrônicas (NF-e, NFS-e, NFC-e e NFA-e)"] = true;
      }

      if (item.includes("Extrato NF-e")) {
        variacoes["Extrato de validação no portal NF-e"] = true;
      }

      if (item.includes("Projeto de viabilidade")) {
        variacoes[
          "Projeto de viabilidade agropecuária assinada por profissional técnico habilitado"
        ] = true;
      }

      if (item.includes("Declaração emitida por associação")) {
        variacoes[
          "Declaração emitida pela associação no período dos 12 últimos meses acompanhada da assinatura do titular"
        ] = true;
      }
    });

    return variacoes;
  }

  function variacoesRendaPF(tipoRenda = []) {
    const variacoes = {};

    if (!Array.isArray(tipoRenda)) return variacoes;

    tipoRenda.forEach((item) => {
      if (item.includes("Contracheque/holerite")) {
        variacoes["Contracheque/holerite"] = true;
      }

      if (item.includes("Declaração de Ajuste Anual de Imposto de Renda")) {
        variacoes[
          "Declaração de Ajuste Anual de Imposto de Renda (íntegra, com recibo de entrega)"
        ] = true;
      }

      if (item.includes("Pró-labore")) {
        variacoes["Pró-labore, contendo assinatura do contador"] = true;
      }

      if (item.includes("Aposentadoria/pensão")) {
        variacoes["Aposentadoria/pensão"] = true;
      }

      if (item.includes("Aluguel")) {
        variacoes["Aluguel"] = true;
      }

      if (item.includes("Outros rendimentos")) {
        variacoes["Outros rendimentos"] = true;
      }
    });

    return variacoes;
  }

  function variacoesSemoventes() {
    return {
      "Declaração de vacinação (ficha sanitária animal) e/ou Demonstrativo do Movimento de Gado (DMG) (dentro de 90 dias)": true,
    };
  }

  function variacoesVeiculosPR() {
    return {
      "Certificado de Registro e Licenciamento de Veículo (CRLV) (ano vigente)": true,
      "Nota fiscal de aquisição emitida há menos de 30 dias": true,
      "Documento Único de Transferência de veículos (DUT) (dentro de 30 dias)": true,
      "Declaração do Imposto de Renda (ano vigente, com recibo de entrega)": true,
    };
  }

  function variacoesSituacaoTerraPR(situacaoTerra) {
    if (situacaoTerra === "Terra própria") {
      return {
        "Escritura ou contrato de compra e venda registrado no Cartório de Registro de Imóveis": true,
        "Certidão emitida por Cartório de Registro de Imóveis (mínimo: dados do imóvel e proprietários)": true,
        "Folha do carnê do IPTU (ano vigente)": true,
        "Declaração do Imposto sobre a Propriedade Territorial Rural (ITR) do último exercício": true,
        "Certificado de cadastro de imóvel rural (INCRA)": true,
        "Balanço ou balancete que demonstre, separadamente, os bens imóveis": true,
      };
    }

    if (situacaoTerra === "Arrendada") {
      return {
        "Contrato de arrendamento": true,
      };
    }

    if (situacaoTerra === "Comodato") {
      return {
        "Contrato de comodato": true,
        "Carta de anuência": true,
      };
    }

    return {};
  }

  function variacoesBensAdicionaisPR(lista = []) {
    return adicionarVariacoesPorLista(lista);
  }

  function variacoesDocsAdicionaisPR(lista = []) {
    const variacoes = {};
    if (!Array.isArray(lista)) return variacoes;

    lista.forEach((item) => {
      if (item === "CAR") {
        variacoes["CAR"] = true;
      }
      if (item === "CCIR") {
        variacoes["CCIR"] = true;
      }
      if (item === "ITR") {
        variacoes["ITR"] = true;
      }
    });

    return variacoes;
  }

  function variacoesSociosPJ(respostas) {
    const quantidadeSocios = parseQuantidadeSocios(respostas.quantidadeSocios);
    const variacoes = {};

    for (let i = 1; i <= quantidadeSocios; i++) {
      const identificador = i === 1 ? "principal" : `${i}`;

      variacoes[`CPF do sócio ${identificador}`] = true;
      variacoes[`RG ou CNH do sócio ${identificador}`] = true;
      variacoes[`Comprovante de endereço do sócio ${identificador}`] = true;
      variacoes[`Comprovante de renda do sócio ${identificador}`] = true;

      if (i === 1) {
        const certidoes = {
          casado: `Certidão de casamento do sócio ${identificador}`,
          viuvo: `Certidão de óbito do cônjuge do sócio ${identificador}`,
          divorciado: `Certidão de divórcio do sócio ${identificador}`,
          uniao_estavel: `Contrato de união estável do sócio ${identificador}`,
        };

        const docEstadoCivil = certidoes[respostas.estadoCivilSocioPrincipal];
        if (docEstadoCivil) {
          variacoes[docEstadoCivil] = true;
        }
      } else {
        variacoes[
          `Certidão de casamento ou equivalente do sócio ${identificador} (se aplicável)`
        ] = true;
      }
    }

    return variacoes;
  }

  // =========================
  // PR
  // =========================
  function entrevistaPR(respostas) {
    if (respostas.temPendencia) {
      return { bloquear: true, documentos: {} };
    }

    const documentos = {};

    // Básicos obrigatórios
    marcarSimples(documentos, "foto");
    marcarSimples(documentos, "telefone");
    marcarSimples(documentos, "email");
    marcarSimples(documentos, "inscricao_produtor");

    // Residência
    marcarGrupo(documentos, "residencia", variacoesResidenciaPRPF());

    // Documento de identificação
    marcarGrupo(
      documentos,
      "doc_identificacao",
      variacoesDocIdentificacaoPR(respostas.tipoIdentificacao)
    );

    // Renda
    marcarGrupo(documentos, "renda", variacoesRendaPR(respostas.tipoRenda));

    // Estado civil
    if (respostas.estadoCivil && respostas.estadoCivil !== "solteiro") {
      marcarGrupo(
        documentos,
        "estado_civil",
        estadoCivilParaVariacao(respostas.estadoCivil)
      );
    }

    // Semoventes
    if (respostas.possuiSemoventes) {
      marcarGrupo(documentos, "semoventes", variacoesSemoventes());
    }

    // Tudo que cair em patrimônio vai para o mesmo grupo
    const variacoesPatrimonio = {
      ...variacoesSituacaoTerraPR(respostas.situacaoTerra),
      ...(respostas.possuiVeiculos ? variacoesVeiculosPR() : {}),
      ...(respostas.possuiBensAdicionais
        ? variacoesBensAdicionaisPR(respostas.bensAdicionais)
        : {}),
      ...(respostas.documentosAdicionais
        ? variacoesDocsAdicionaisPR(respostas.listaDocumentosAdicionais)
        : {}),
    };

    if (Object.keys(variacoesPatrimonio).length > 0) {
      marcarGrupo(documentos, "bens_patrimonio", variacoesPatrimonio);
    }

    return { bloquear: false, documentos };
  }

  // =========================
  // PF
  // =========================
  function entrevistaPF(respostas) {
    if (respostas.temPendencia) {
      return { bloquear: true, documentos: {} };
    }

    const documentos = {};

    // Básicos obrigatórios
    marcarSimples(documentos, "foto");
    marcarSimples(documentos, "telefone");
    marcarSimples(documentos, "email");

    // Residência
    marcarGrupo(documentos, "residencia", variacoesResidenciaPRPF());

    // Documento de identificação
    marcarGrupo(documentos, "doc_identificacao", variacoesDocIdentificacaoPF());

    // Renda
    marcarGrupo(documentos, "renda", variacoesRendaPF(respostas.tipoRenda));

    // Estado civil
    if (
      respostas.estadoCivil &&
      respostas.estadoCivil !== "solteiro" &&
      respostas.estadoCivil !== "Nenhum"
    ) {
      marcarGrupo(
        documentos,
        "estado_civil",
        estadoCivilParaVariacao(respostas.estadoCivil)
      );
    }

    // Patrimônio
    const patrimonioVariacoes = adicionarVariacoesPorLista(
      respostas.comprovantesPatrimonio
    );

    if (Object.keys(patrimonioVariacoes).length > 0) {
      marcarGrupo(documentos, "bens_patrimonio", patrimonioVariacoes);
    }

    return { bloquear: false, documentos };
  }

  // =========================
  // PJ
  // =========================
  function entrevistaPJ(respostas) {
    if (respostas.temPendencia) {
      return { bloquear: true, documentos: {} };
    }

    const documentos = {};
    const classificacao = respostas.classificacaoEmpresa || "";

    // Básicos obrigatórios
    marcarSimples(documentos, "contatos");
    marcarSimples(documentos, "email");
    marcarSimples(documentos, "cartao_cnpj");
    marcarSimples(documentos, "endereco_empresa");

    // Associação
    if (
      classificacao.includes("Associação") ||
      classificacao.includes("Entidade sem fins lucrativos")
    ) {
      marcarSimples(documentos, "ata_estatuto");
    }

    // Última alteração contratual
    // MEI normalmente não exige aqui
    if (!classificacao.includes("MEI")) {
      marcarSimples(documentos, "ultima_alteracao_contratual");
    }

    // Faturamento
    const faturamentoVariacoes = adicionarVariacoesPorLista(
      respostas.comprovantesFaturamento
    );

    if (Object.keys(faturamentoVariacoes).length > 0) {
      marcarGrupo(documentos, "faturamento", faturamentoVariacoes);
    }

    // Documentos dos sócios / administradores
    marcarGrupo(
      documentos,
      "documentos_socios_administradores",
      variacoesSociosPJ(respostas)
    );

    // Patrimônio
    const patrimonioVariacoes = adicionarVariacoesPorLista(
      respostas.comprovantesPatrimonio
    );

    if (Object.keys(patrimonioVariacoes).length > 0) {
      marcarGrupo(documentos, "bens_patrimonio", patrimonioVariacoes);
    }

    return { bloquear: false, documentos };
  }

  return {
    entrevistaPR,
    entrevistaPF,
    entrevistaPJ,
  };
}