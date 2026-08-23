/**
 * Task Builder v1.0
 * Traduce NEURA Core + strategy a payloads para el proveedor activo.
 * Sprint 1: Claude-only. Interface provider-agnostic.
 */
'use strict';

function buildSystemString(core, strategy) {
  const parts = [
    core.identity,
    (Array.isArray(core.principles) ? core.principles.join(' ') : core.principles || ''),
    core.tone,
    (Array.isArray(core.restrictions) ? core.restrictions.join(' ') : core.restrictions || ''),
    // identity_guard.framing siempre presente — es parte del Core efectivo
    (core.identity_guard && core.identity_guard.framing ? core.identity_guard.framing : ''),
  ];
  if (strategy && strategy.trim()) parts.push(strategy.trim());
  return parts.filter(Boolean).join('\n\n');
}

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

function buildPayload(providerId, messages, core, options = {}) {
  if (!core) throw new Error('Task Builder: core no disponible.');
  if (!Array.isArray(messages))  throw new Error('Task Builder: messages debe ser un array.');
  const strategy    = options.strategy    || '';
  const modelParams = options.modelParams || {};
  const systemString = buildSystemString(core, strategy);
  switch (providerId) {
    case 'claude': return buildClaudePayload(messages, systemString, modelParams);
    default: throw new Error(`Task Builder: proveedor '${providerId}' no implementado.`);
  }
}

function previewSystemString(core, strategy) {
  return buildSystemString(core, strategy);
}

module.exports = { buildPayload, previewSystemString };
