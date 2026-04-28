
// src/utils/taxasCampanha.js

/**
 * @typedef {'SEM_REFORCO'|'AVAL'|'REAL'} Reforco
 */

// ✅ fallback: a matriz que você já tem hoje (hardcoded)
const MATRIZ_FALLBACK = {
  // ≥ 30%
  'FAIXA_30|CURTO|SEM_REFORCO': 1.88,
  'FAIXA_30|CURTO|AVAL': 1.69,
  'FAIXA_30|CURTO|REAL': 1.50,
  'FAIXA_30|LONGO|SEM_REFORCO': 2.19,
  'FAIXA_30|LONGO|AVAL': 1.97,
  'FAIXA_30|LONGO|REAL': 1.75,

  // 20%–29,99%
  'FAIXA_20|CURTO|SEM_REFORCO': 2.00,
  'FAIXA_20|CURTO|AVAL': 1.80,
  'FAIXA_20|CURTO|REAL': 1.60,
  'FAIXA_20|LONGO|SEM_REFORCO': 2.31,
  'FAIXA_20|LONGO|AVAL': 2.08,
  'FAIXA_20|LONGO|REAL': 1.85,

  // 10%–19,99%
  'FAIXA_10|CURTO|SEM_REFORCO': 2.13,
  'FAIXA_10|CURTO|AVAL': 1.91,
  'FAIXA_10|CURTO|REAL': 1.70,
  'FAIXA_10|LONGO|SEM_REFORCO': 2.49,
  'FAIXA_10|LONGO|AVAL': 2.24,
  'FAIXA_10|LONGO|REAL': 2.14
};

// ✅ matriz carregada do backend em runtime
let matrizAtual = null;

// ✅ matriz específica para Campanha de Prejuízo
const MATRIZ_PREJUIZO = {
  // Parcelamento até 24 meses
  // ≥ 30%
  'FAIXA_30|CURTO|SEM_REFORCO': 2.19,
  'FAIXA_30|CURTO|AVAL': 1.97,
  'FAIXA_30|CURTO|REAL': 1.75,
  // 20%–29,99%
  'FAIXA_20|CURTO|SEM_REFORCO': 2.31,
  'FAIXA_20|CURTO|AVAL': 2.08,
  'FAIXA_20|CURTO|REAL': 1.85,
  // 10%–19,99%
  'FAIXA_10|CURTO|SEM_REFORCO': 2.49,
  'FAIXA_10|CURTO|AVAL': 2.24,
  'FAIXA_10|CURTO|REAL': 1.99,

  // Parcelamento acima de 24 meses
  // ≥ 30%
  'FAIXA_30|LONGO|SEM_REFORCO': 2.31,
  'FAIXA_30|LONGO|AVAL': 2.08,
  'FAIXA_30|LONGO|REAL': 1.85,
  // 20%–29,99%
  'FAIXA_20|LONGO|SEM_REFORCO': 2.49,
  'FAIXA_20|LONGO|AVAL': 2.24,
  'FAIXA_20|LONGO|REAL': 1.99,
  // 10%–19,99%
  'FAIXA_10|LONGO|SEM_REFORCO': 2.68,
  'FAIXA_10|LONGO|AVAL': 2.41,
  'FAIXA_10|LONGO|REAL': 2.14
};

/** Define a matriz vinda do backend */
export function setMatrizTaxasCampanha(matriz) {
  // valida formato básico (objeto simples)
  if (matriz && typeof matriz === 'object' && !Array.isArray(matriz)) {
    matrizAtual = matriz;
  } else {
    matrizAtual = null;
  }
}

/** (Opcional) lê a matriz atual (útil no Admin) */
export function getMatrizTaxasCampanha() {
  return matrizAtual ?? MATRIZ_FALLBACK;
}

/**
 * Retorna a taxa a.m. conforme faixa de entrada, prazo e reforço.
 * @param {{
 *   entradaPercentual: number,
 *   prazoMeses: number,
 *   reforco?: Reforco,
 *   reforcoGarantia?: boolean,
 *   novoAvalista?: boolean,
 *   tipoCampanha?: 'normal'|'prejuizo'
 * }} params
 * @returns {number|null}
 */
export function obterTaxaCampanha(params) {
  const {
    entradaPercentual,
    prazoMeses,
    reforco,
    reforcoGarantia,
    novoAvalista,
    tipoCampanha = 'normal'
  } = params || {};

  // ===== Normalização do REFORÇO =====
  let reforcoUsado;
  if (reforco === 'SEM_REFORCO' || reforco === 'AVAL' || reforco === 'REAL') {
    reforcoUsado = reforco;
  } else if (novoAvalista === true) {
    reforcoUsado = 'AVAL';
  } else if (reforcoGarantia === true) {
    reforcoUsado = 'AVAL';
  } else {
    reforcoUsado = 'SEM_REFORCO';
  }

  const entrada = Number(entradaPercentual) || 0;
  const prazo = Number(prazoMeses) || 0;

  // Faixas
  let faixa;
  if (entrada >= 30) faixa = 'FAIXA_30';
  else if (entrada >= 20) faixa = 'FAIXA_20';
  else if (entrada >= 10) faixa = 'FAIXA_10';
  else faixa = 'SEM_FAIXA';

  if (faixa === 'SEM_FAIXA') return null;

  const curto = prazo <= 24;

  // ✅ usa matriz específica ou fallback
  let matriz;
  if (tipoCampanha === 'prejuizo') {
    matriz = MATRIZ_PREJUIZO;
  } else {
    matriz = matrizAtual ?? MATRIZ_FALLBACK;
  }

  const chave = `${faixa}|${curto ? 'CURTO' : 'LONGO'}|${reforcoUsado}`;
  return matriz[chave] ?? null;
}

/**
 * Verifica se um contrato é classificado como Prejuízo
 * @param {any} contrato 
 * @returns {boolean}
 */
export function isContratoPrejuizo(contrato) {
  return contrato?.ehPrejuizo === true || 
         contrato?.EhPrejuizo === true ||
         contrato?.classificacao === 'PREJUIZO' || 
         contrato?.situacao === 'PREJUIZO' ||
         contrato?.tipoContrato === 'PREJUIZO';
}

/**
 * Verifica regras de prioridade e bloqueio de campanhas conforme especificação
 * @param {Array<any>} contratos
 * @returns {{
 *   tipoCampanhaPermitida: 'normal'|'prejuizo'|null,
 *   permiteAtivacao: boolean,
 *   motivoBloqueio: string|null
 * }}
 */
export function verificarRegrasCampanha(contratos) {
  if (!contratos || contratos.length === 0) {
    return { tipoCampanhaPermitida: null, permiteAtivacao: false, motivoBloqueio: 'Sem contratos' };
  }

  const contratosPrejuizo = contratos.filter(isContratoPrejuizo);
  const contratosNaoPrejuizo = contratos.filter(c => !isContratoPrejuizo(c));

  // 2.1 Contratos em Prejuízo - apenas contratos prejuízo
  if (contratosPrejuizo.length > 0 && contratosNaoPrejuizo.length === 0) {
    return {
      tipoCampanhaPermitida: 'prejuizo',
      permiteAtivacao: false, // nunca ativa automaticamente
      motivoBloqueio: null
    };
  }

  // 2.2 Mistura de Contratos - prejuízo + não prejuízo
  if (contratosPrejuizo.length > 0 && contratosNaoPrejuizo.length > 0) {
    return {
      tipoCampanhaPermitida: null,
      permiteAtivacao: false,
      motivoBloqueio: 'Mistura de contratos em prejuízo com contratos normais não permite ativação de campanha'
    };
  }

  // 2.3 Ausência de Contrato em Prejuízo - regras normais (permite qualquer mistura de períodos)
  return {
    tipoCampanhaPermitida: 'normal',
    permiteAtivacao: false, // nunca ativa automaticamente
    motivoBloqueio: null
  };
}

/**
 * Calcula desconto máximo na atualização conforme faixa de entrada para Campanha de Prejuízo
 * @param {number} entradaPercentual
 * @returns {number|null}
 */
export function calcularDescontoPrejuizo(entradaPercentual) {
  const entrada = Number(entradaPercentual) || 0;
  
  if (entrada >= 30) return 70;      // 30% ou mais
  if (entrada >= 20) return 60;      // 20% a 29,99%
  if (entrada >= 10) return 50;      // 10% a 19,99%
  
  return null; // abaixo de 10% - não se aplica campanha
}
