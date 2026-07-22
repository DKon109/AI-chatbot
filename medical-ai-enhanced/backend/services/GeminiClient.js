const { GoogleGenAI } = require('@google/genai');

class GeminiClient {
  constructor(options = {}) {
    const hasInjectedClient = Object.prototype.hasOwnProperty.call(options, 'client');
    const apiKey = options.apiKey || process.env.GEMINI_API_KEY;

    this.client = hasInjectedClient
      ? options.client
      : (apiKey ? new GoogleGenAI({ apiKey }) : null);
    this.model = options.model || process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
    this.timeoutMs = Number(options.timeoutMs || process.env.GEMINI_TIMEOUT_MS || 20000);
  }

  get isConfigured() {
    return Boolean(this.client);
  }

  async generateStructured({ input, systemInstruction, schema }) {
    if (!this.client) throw new Error('Gemini is not configured');

    const interaction = await this.client.interactions.create({
      model: this.model,
      store: false,
      input,
      system_instruction: systemInstruction,
      response_format: {
        type: 'text',
        mime_type: 'application/json',
        schema
      }
    }, { timeout: this.timeoutMs });

    const outputText = interaction.output_text || interaction.outputText;
    if (!outputText) throw new Error('Gemini returned no structured output');
    const parsed = JSON.parse(outputText);
    this.validateAgainstSchema(parsed, schema);
    return parsed;
  }

  async generateText({ input, systemInstruction }) {
    if (!this.client) throw new Error('Gemini is not configured');

    const interaction = await this.client.interactions.create({
      model: this.model,
      store: false,
      input,
      system_instruction: systemInstruction
    }, { timeout: this.timeoutMs });

    const outputText = interaction.output_text || interaction.outputText;
    if (!outputText) throw new Error('Gemini returned no text output');
    return outputText;
  }

  validateAgainstSchema(value, schema, path = 'response') {
    if (schema.type === 'object') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${path} must be an object`);
      }
      for (const key of schema.required || []) {
        if (!Object.prototype.hasOwnProperty.call(value, key)) {
          throw new Error(`${path}.${key} is required`);
        }
      }
      if (schema.additionalProperties === false) {
        for (const key of Object.keys(value)) {
          if (!Object.prototype.hasOwnProperty.call(schema.properties || {}, key)) {
            throw new Error(`${path}.${key} is not allowed`);
          }
        }
      }
      for (const [key, childSchema] of Object.entries(schema.properties || {})) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          this.validateAgainstSchema(value[key], childSchema, `${path}.${key}`);
        }
      }
      return;
    }

    if (schema.type === 'array') {
      if (!Array.isArray(value)) throw new Error(`${path} must be an array`);
      value.forEach((item, index) => this.validateAgainstSchema(item, schema.items, `${path}[${index}]`));
      return;
    }

    if (schema.type === 'string') {
      if (typeof value !== 'string') throw new Error(`${path} must be a string`);
      if (schema.enum && !schema.enum.includes(value)) throw new Error(`${path} contains an unsupported value`);
      return;
    }

    if (schema.type === 'number' && typeof value !== 'number') throw new Error(`${path} must be a number`);
    if (schema.type === 'integer' && !Number.isInteger(value)) throw new Error(`${path} must be an integer`);
    if (schema.type === 'boolean' && typeof value !== 'boolean') throw new Error(`${path} must be a boolean`);
  }
}

module.exports = GeminiClient;
