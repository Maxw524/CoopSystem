import { useEffect, useMemo, useState } from "react";
import { useEntrevista } from "../hooks/useEntrevista";

// =========================
// CONFIGURAÇÃO DAS PERGUNTAS
// =========================
const perguntasPorTipo = {
  PR: [
    {
      titulo:
        "O CNPJ do produtor possui alguma pendência? Se SIM, não será possível abrir conta.",
      campo: "temPendencia",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo: "O responsável é brasileiro ou estrangeiro residente no Brasil?",
      campo: "tipoIdentificacao",
      tipo: "select",
      obrigatorio: true,
      opcoes: [
        "Brasileiro",
        "Estrangeiro residente por mais de 12 meses",
        "Estrangeiro com protocolo",
        "Estrangeiro com visto superior a 12 meses",
      ],
    },
    {
      titulo: "Qual estado civil para selecionar o documento específico?",
      campo: "estadoCivil",
      tipo: "select",
      obrigatorio: true,
      opcoes: [
        "solteiro",
        "casado",
        "viuvo",
        "divorciado",
        "separado",
        "uniao_estavel",
      ],
    },
    {
      titulo:
        "Como você deseja comprovar sua renda rural? (pode selecionar mais de um)",
      campo: "tipoRenda",
      tipo: "checkbox",
      obrigatorio: true,
      opcoes: [
        "Laudo de vistoria (válido por 1 ano)",
        "Declaração de IR com produção rural",
        "CAF",
        "Bloco de produtor (últimos 12 meses)",
        "Notas fiscais",
        "Extrato NF-e validado no portal oficial",
        "Projeto de viabilidade agropecuária",
        "Declaração emitida por associação (últimos 12 meses, assinaturas)",
      ],
    },
    {
      titulo: "Você possui gado ou outros semoventes vinculados à produção?",
      campo: "possuiSemoventes",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo: "Possui veículos ou máquinas vinculadas à produção?",
      campo: "possuiVeiculos",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo:
        "A produção ocorre em terra própria, arrendada, comodato ou não se aplica?",
      campo: "situacaoTerra",
      tipo: "select",
      obrigatorio: true,
      opcoes: ["Terra própria", "Arrendada", "Comodato", "Não se aplica"],
    },
    {
      titulo: "Possui mais algum bem/imóveis?",
      campo: "possuiBensAdicionais",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo: "Quais bens/imóveis deseja incluir?",
      campo: "bensAdicionais",
      tipo: "checkbox",
      obrigatorio: false,
      mostrarSe: (respostas) => respostas.possuiBensAdicionais === true,
      opcoes: [
        "Declaração do Imposto de Renda (ano vigente, com recibo Serpro)",
        "Escritura ou contrato de compra e venda registrado no Cartório de Registro de Imóveis",
        "Certidão emitida por Cartório de Registro de Imóveis (matrícula, ônus reais, ações reipersecutórias)",
        "Folha do carnê do IPTU (ano vigente)",
        "Declaração do ITR do último exercício com recibo Serpro",
        "Certificado de cadastro de imóvel rural (Incra)",
        "Balanço ou balancete que demonstre os bens imóveis",
      ],
    },
    {
      titulo:
        "Deseja enviar documentos adicionais que podem facilitar liberações futuras?",
      campo: "documentosAdicionais",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo: "Quais documentos adicionais opcionais deseja enviar?",
      campo: "listaDocumentosAdicionais",
      tipo: "checkbox",
      obrigatorio: false,
      mostrarSe: (respostas) => respostas.documentosAdicionais === true,
      opcoes: ["CAR", "CCIR", "ITR"],
    },
  ],

  PF: [
    {
      titulo:
        "O CPF possui alguma pendência? Se SIM, não será possível abrir conta.",
      campo: "temPendencia",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo: "Qual estado civil para selecionar o documento específico?",
      campo: "estadoCivil",
      tipo: "select",
      obrigatorio: true,
      opcoes: ["solteiro", "casado", "viuvo", "divorciado", "uniao_estavel"],
    },
    {
      titulo: "Qual tipo de renda você possui?",
      campo: "tipoRenda",
      tipo: "checkbox",
      obrigatorio: true,
      opcoes: [
        "Contracheque/holerite",
        "Declaração de Ajuste Anual de Imposto de Renda",
        "Pró-labore",
        "Aposentadoria/pensão",
        "Aluguel",
        "Outros rendimentos",
        "Não possui renda",
      ],
    },
    {
      titulo: "Possui Bens/Patrimônio?",
      campo: "comprovantesPatrimonio",
      tipo: "checkbox",
      obrigatorio: false,
      opcoes: [
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
        "CAR (Cadastro Ambiental Rural)",
        "Não possui",
      ],
    },
  ],

  PJ: [
    {
      titulo:
        "O CNPJ possui pendências? Se SIM, não será possível abrir conta.",
      campo: "temPendencia",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo: "Qual é a classificação completa da empresa?",
      campo: "classificacaoEmpresa",
      tipo: "select",
      obrigatorio: true,
      opcoes: [
        "MEI – Simples Nacional",
        "ME – Simples Nacional",
        "EPP – Simples Nacional",
        "LTDA – Simples Nacional",
        "S.A – Simples Nacional",
        "Cooperativa – Simples Nacional",
        "Associação – Simples Nacional",

        "ME – Lucro Presumido",
        "EPP – Lucro Presumido",
        "LTDA – Lucro Presumido",
        "S.A – Lucro Presumido",
        "Cooperativa – Lucro Presumido",

        "ME – Lucro Real",
        "EPP – Lucro Real",
        "LTDA – Lucro Real",
        "S.A – Lucro Real",
        "Cooperativa – Lucro Real",

        "Associação / Entidade sem fins lucrativos",
        "Condomínio Edilício",
        "Outra",
      ],
    },
    {
      titulo: "A empresa possui Inscrição Estadual?",
      campo: "possuiInscricaoEstadual",
      tipo: "boolean",
      obrigatorio: true,
    },
    {
      titulo:
        "Qual comprovante de faturamento você possui? (pode selecionar mais de um)",
      campo: "comprovantesFaturamento",
      tipo: "checkbox",
      obrigatorio: true,
      opcoes: [
        "Notas fiscais dos últimos 12 meses",
        "Extrato de validação no portal NF-e",
        "Relação de faturamento dos últimos 12 meses assinada",
        "Declaração Anual Simplificada para o Microempreendedor Individual (DASN-SIMEI)",
        "Extrato PGDAS-D (últimos 12 meses)",
        "Demonstração do Resultado do Exercício (DRE) ou Demonstração de Sobras e Perdas (DSP) do último exercício",
        "Escrituração Contábil Digital (ECD)",
        "Escrituração Contábil Fiscal (ECF)",
        "Projeção de faturamento próximos 12 meses (empresa com menos de 12 meses)",
      ],
    },
    {
      titulo: "Quantos sócios existem na empresa?",
      campo: "quantidadeSocios",
      tipo: "select",
      obrigatorio: true,
      opcoes: ["1", "2", "3", "4", "5 ou mais"],
    },
    {
      titulo: "Qual o estado civil do sócio principal?",
      campo: "estadoCivilSocioPrincipal",
      tipo: "select",
      obrigatorio: true,
      opcoes: ["solteiro", "casado", "viuvo", "divorciado", "uniao_estavel"],
    },
    {
      titulo: "Qual comprovante de bens/patrimônio você possui?",
      campo: "comprovantesPatrimonio",
      tipo: "checkbox",
      obrigatorio: false,
      opcoes: [
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
        "CAR (Cadastro Ambiental Rural)",
      ],
    },
  ],
};

// =========================
// HELPERS
// =========================
function formatarTituloTipo(tipo) {
  if (tipo === "PR") return "Produtor Rural";
  if (tipo === "PF") return "Pessoa Física";
  return "Pessoa Jurídica";
}

function respostaValida(pergunta, respostas) {
  const valor = respostas[pergunta.campo];

  if (!pergunta.obrigatorio) return true;

  if (pergunta.tipo === "boolean") {
    return typeof valor === "boolean";
  }

  if (pergunta.tipo === "select") {
    return Boolean(valor);
  }

  if (pergunta.tipo === "checkbox") {
    return Array.isArray(valor) && valor.length > 0;
  }

  return true;
}

// =========================
// COMPONENTE
// =========================
export default function Entrevista({ tipo, onFinalizar }) {
  const { entrevistaPR, entrevistaPF, entrevistaPJ } = useEntrevista();

  const [step, setStep] = useState(1);
  const [respostas, setRespostas] = useState({});

  const perguntas = useMemo(() => {
    const lista = perguntasPorTipo[tipo] || [];
    return lista.filter((pergunta) => {
      if (!pergunta.mostrarSe) return true;
      return pergunta.mostrarSe(respostas);
    });
  }, [tipo, respostas]);

  const perguntaAtual = perguntas[step - 1];

  useEffect(() => {
    if (step > perguntas.length) {
      setStep(perguntas.length || 1);
    }
  }, [step, perguntas.length]);

  function atualizar(chave, valor) {
    setRespostas((prev) => ({
      ...prev,
      [chave]: valor,
    }));
  }

  function finalizar(respostasFinais = respostas) {
    let resultado = null;

    if (tipo === "PR") resultado = entrevistaPR(respostasFinais);
    if (tipo === "PF") resultado = entrevistaPF(respostasFinais);
    if (tipo === "PJ") resultado = entrevistaPJ(respostasFinais);

    onFinalizar(resultado);
  }

  function responderBoolean(valor) {
    const novasRespostas = {
      ...respostas,
      [perguntaAtual.campo]: valor,
    };

    setRespostas(novasRespostas);

    // Se respondeu SIM para pendência, encerra imediatamente
    if (perguntaAtual.campo === "temPendencia" && valor === true) {
      finalizar(novasRespostas);
      return;
    }

    if (step < perguntas.length) {
      setStep((prev) => prev + 1);
    } else {
      finalizar(novasRespostas);
    }
  }

  function responderSelect(valor) {
    const novasRespostas = {
      ...respostas,
      [perguntaAtual.campo]: valor,
    };

    setRespostas(novasRespostas);

    if (!valor) return;

    if (step < perguntas.length) {
      setTimeout(() => {
        setStep((prev) => prev + 1);
      }, 250);
    } else {
      setTimeout(() => {
        finalizar(novasRespostas);
      }, 250);
    }
  }

  function toggleCheckbox(opcao) {
    const valoresAtuais = respostas[perguntaAtual.campo] || [];
    const jaExiste = valoresAtuais.includes(opcao);

    const novosValores = jaExiste
      ? valoresAtuais.filter((item) => item !== opcao)
      : [...valoresAtuais, opcao];

    atualizar(perguntaAtual.campo, novosValores);
  }

  function irParaProxima() {
    if (step < perguntas.length) {
      setStep((prev) => prev + 1);
    } else {
      finalizar();
    }
  }

  function voltar() {
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  }

  function sair() {
    window.location.href = "/credito-checklist-cadastro";
  }

  if (!perguntaAtual) {
    return null;
  }

  const podeAvancar = respostaValida(perguntaAtual, respostas);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: 30 }}>
      <div className="card">
        <div className="card-title">
          Entrevista – {formatarTituloTipo(tipo)}
        </div>

        {/* Progresso */}
        <div style={{ marginBottom: 30 }}>
          <div
            style={{
              fontSize: 14,
              color: "var(--color-text-muted)",
              marginBottom: 8,
            }}
          >
            Passo {step} de {perguntas.length}
          </div>

          <div
            style={{
              width: "100%",
              height: 8,
              background: "var(--color-border-input)",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${(step / perguntas.length) * 100}%`,
                height: "100%",
                background: "var(--color-primary)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>

        {/* Pergunta */}
        <div style={{ marginBottom: 30 }}>
          <h3 style={{ color: "var(--color-text-main)", marginBottom: 20 }}>
            {perguntaAtual.titulo}
          </h3>

          {/* BOOLEAN */}
          {perguntaAtual.tipo === "boolean" && (
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="rn-button primary"
                onClick={() => responderBoolean(true)}
                style={{ padding: "12px 24px", fontSize: 16 }}
              >
                ✅ Sim
              </button>

              <button
                className="rn-button"
                onClick={() => responderBoolean(false)}
                style={{ padding: "12px 24px", fontSize: 16 }}
              >
                ❌ Não
              </button>
            </div>
          )}

          {/* SELECT */}
          {perguntaAtual.tipo === "select" && (
            <select
              value={respostas[perguntaAtual.campo] || ""}
              onChange={(e) => responderSelect(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 8,
                border: "1px solid var(--color-border-input)",
                background: "var(--color-bg-input)",
                color: "var(--color-text-main)",
                fontSize: 14,
              }}
            >
              <option value="">Selecione...</option>
              {perguntaAtual.opcoes.map((opcao) => (
                <option key={opcao} value={opcao}>
                  {opcao}
                </option>
              ))}
            </select>
          )}

          {/* CHECKBOX */}
          {perguntaAtual.tipo === "checkbox" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {perguntaAtual.opcoes.map((opcao) => {
                const marcado =
                  respostas[perguntaAtual.campo]?.includes(opcao) || false;

                return (
                  <label
                    key={opcao}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      cursor: "pointer",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid var(--color-border-input)",
                      background: marcado
                        ? "var(--color-bg-hover)"
                        : "var(--color-bg-input)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={marcado}
                      onChange={() => toggleCheckbox(opcao)}
                      style={{ marginTop: 3, cursor: "pointer" }}
                    />
                    <span style={{ lineHeight: 1.4 }}>{opcao}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Rodapé / navegação */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: 12 }}>
            <button
              className="rn-button"
              onClick={sair}
              style={{
                padding: "10px 20px",
                backgroundColor: "var(--color-danger)",
              }}
            >
              ❌ Sair
            </button>

            {step > 1 && (
              <button
                className="rn-button"
                onClick={voltar}
                style={{ padding: "10px 20px" }}
              >
                ← Voltar
              </button>
            )}
          </div>

          {/* Para checkbox usamos botão Próxima/Finalizar.
              Boolean e Select já avançam automaticamente */}
          {perguntaAtual.tipo === "checkbox" && (
            <div style={{ display: "flex", gap: 12 }}>
              {step < perguntas.length ? (
                <button
                  className="rn-button primary"
                  onClick={irParaProxima}
                  disabled={!podeAvancar}
                  style={{ padding: "10px 20px" }}
                >
                  Próxima →
                </button>
              ) : (
                <button
                  className="rn-button primary"
                  onClick={() => finalizar()}
                  disabled={!podeAvancar}
                  style={{
                    padding: "12px 24px",
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  🎯 Finalizar entrevista
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}