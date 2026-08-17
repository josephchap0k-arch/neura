/**
 * Task Builder v1.0
 * 
 * Traduce NEURA Core + strategy a un payload ejecutable
 * para el proveedor de IA activo.
 * 
 * Interfaz diseñada para ser provider-agnostic.
 * Implementación actual: Claude (Anthropic).
 * 
 * Para agregar un proveedor: agregar un caso en buildPayload()
 * y una función buildXxxPayload(). No tocar neura-core.js.
 * 
 * INVARIANTE: nunca muta el objeto core recibido.
 */

'use strict';

/**
 * Construye el string de sistema a partir de NEURA Core.
 * 
 * Orden de composición:
 * identity → principles → tone → restrictions → strategy
 * 
 * El orden es deliberado: la identidad establece quién es NEURA,
 * los principios establecen cómo opera, el tono cómo habla,
 * las restricciones qué nunca hace, y la strategy ajusta
 * el comportamiento para el pedido actual.
 * 
 * @param {object} core - NEURA Core (inmutable)
 * @param {string} strategy - Instrucciones adicionales para este request (opcional)
 * @returns {string} system prompt completo
 */
function buildSystemString(core, strategy) {
  const parts = [
    core.identity,
    core.principles.join(' '),
    core.tone,
    core.restrictions.join(' '),
  ];

  if (strategy && strategy.trim()) {
    parts.push(strategy.trim());
  }

  return parts.filter(Boolean).join('\n\n');
}

/**
 * Construye el payload para Claude (Anthropic Messages API).
 * 
 * @param {Array} messages - Array de {role, content}
 * @param {string} systemString - System prompt construido
 * @param {object} params - Parámetros del modelo
 * @returns {object} payload listo para fetch
 */
function buildClaudePayload(messages, systemString, params) {
  return {
    provider: 'claude',
    apiUrl: 'https://api.anthropic.com/v1/messages',
    headers: (apiKey) => ({
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    }),
    body: (stream) => JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens || 1500,
      system: systemString,
      messages,
      stream,
    }),
  };
}

/**
 * Interface pública del Task Builder.
 * 
 * @param {string} providerId - 'claude' | (futuro: 'gpt' | 'gemini' | ...)
 * @param {Array} messages - Historial de conversación [{role, content}]
 * @param {object} core - NEURA Core (no mutable)
 * @param {object} options
 * @param {string} options.strategy - Instrucciones adicionales para este request
 * @param {object} options.modelParams - Parámetros del modelo {model, maxTokens}
 * @returns {object} payload con provider, apiUrl, headers fn, body fn
 */
function buildPayload(providerId, messages, core, options = {}) {
  if (!core || !core.version) {
    throw new Error('Task Builder: core inválido o sin versión.');
  }
  if (!Array.isArray(messages)) {
    throw new Error('Task Builder: messages debe ser un array.');
  }

  const strategy = options.strategy || '';
  const modelParams = options.modelParams || {};
  const systemString = buildSystemString(core, strategy);

  switch (providerId) {
    case 'claude':
      return buildClaudePayload(messages, systemString, modelParams);

    // Interfaz lista para futuros proveedores:
    // case 'gpt':
    //   return buildOpenAIPayload(messages, systemString, modelParams);
    // case 'gemini':
    //   return buildGeminiPayload(messages, systemString, modelParams);

    default:
      throw new Error(`Task Builder: proveedor '${providerId}' no implementado.`);
  }
}

/**
 * Utilidad de diagnóstico: devuelve el system string
 * que se enviaría al proveedor, sin construir el payload completo.
 * Útil para tests de equivalencia.
 */
function previewSystemString(core, strategy) {
  return buildSystemString(core, strategy);
}

module.exports = { buildPayload, previewSystemString };
