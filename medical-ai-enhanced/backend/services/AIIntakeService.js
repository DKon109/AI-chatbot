const crypto = require('crypto');
const OpenAI = require('openai');

const INTAKE_SCHEMA = {
  type: 'object',
  properties: {
    symptoms: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          duration: { type: 'string' },
          severity: { type: 'string', enum: ['mild', 'moderate', 'severe', 'unknown'] },
          qualifiers: { type: 'array', items: { type: 'string' } }
        },
        required: ['name', 'duration', 'severity', 'qualifiers'],
        additionalProperties: false
      }
    },
    reportedRedFlags: { type: 'array', items: { type: 'string' } },
    missingInformation: { type: 'array', items: { type: 'string' } },
    patientFriendlySummary: { type: 'string' },
    clinicianDraft: { type: 'string' },
    uncertainty: { type: 'string' }
  },
  required: [
    'symptoms',
    'reportedRedFlags',
    'missingInformation',
    'patientFriendlySummary',
    'clinicianDraft',
    'uncertainty'
  ],
  additionalProperties: false
};

const SYMPTOM_TERMS = [
  ['chest pain', 'Chest pain'],
  ['difficulty breathing', 'Difficulty breathing'],
  ['shortness of breath', 'Shortness of breath'],
  ['headache', 'Headache'],
  ['dizzy', 'Dizziness'],
  ['dizziness', 'Dizziness'],
  ['fever', 'Fever'],
  ['cough', 'Cough'],
  ['abdominal pain', 'Abdominal pain'],
  ['stomach pain', 'Abdominal pain'],
  ['nausea', 'Nausea'],
  ['vomit', 'Vomiting'],
  ['fatigue', 'Fatigue'],
  ['tired', 'Fatigue'],
  ['back pain', 'Back pain'],
  ['numbness', 'Numbness'],
  ['weakness', 'Weakness']
];

const IMMEDIATE_RULES = [
  { pattern: /chest pain/i, label: 'Chest pain reported' },
  { pattern: /(?:difficulty breathing|shortness of breath|can(?:not|'t) breathe)/i, label: 'Breathing difficulty reported' },
  { pattern: /(?:face droop|slurred speech|one[- ]sided weakness)/i, label: 'Possible stroke warning signs reported' },
  { pattern: /(?:unconscious|passed out|severe bleeding)/i, label: 'Loss of consciousness or severe bleeding reported' },
  { pattern: /(?:suicidal|harm myself|kill myself)/i, label: 'Immediate mental-health safety concern reported' }
];

const URGENT_RULES = [
  { pattern: /(?:severe|worst|rapidly worsening|blood in|high fever)/i, label: 'Severe or worsening symptom language reported' },
  { pattern: /(?:confusion|fainting|persistent vomiting)/i, label: 'Urgent warning symptom reported' }
];

class AIIntakeService {
  constructor(options = {}) {
    const hasInjectedClient = Object.prototype.hasOwnProperty.call(options, 'client');
    this.client = hasInjectedClient
      ? options.client
      : (process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null);
    this.model = options.model || process.env.OPENAI_MODEL || 'gpt-5.6-sol';
  }

  async createIntake({ narrative, userId }) {
    const cleanNarrative = this.cleanNarrative(narrative);
    let structuredIntake;
    let generationMode = 'portfolio_demo';
    let model = null;

    if (this.client) {
      try {
        structuredIntake = await this.extractWithOpenAI(cleanNarrative, userId);
        generationMode = 'openai_structured_output';
        model = this.model;
      } catch (error) {
        // Never make the patient workflow depend on a paid or external service.
        console.error('AI intake extraction fell back to deterministic demo mode:', error.message);
      }
    }

    if (!structuredIntake) {
      structuredIntake = this.createPortfolioDemoIntake(cleanNarrative);
    }

    return {
      structuredIntake,
      safetyAssessment: this.applyDeterministicSafetyRules(cleanNarrative, structuredIntake),
      generationMode,
      model,
      requiresClinicianReview: true,
      disclaimer: 'AI-assisted draft for a fictional portfolio workflow. It is not a diagnosis or a substitute for professional care.'
    };
  }

  cleanNarrative(narrative) {
    if (typeof narrative !== 'string') throw new Error('A symptom narrative is required');
    const clean = narrative.replace(/\s+/g, ' ').trim();
    if (clean.length < 10) throw new Error('Please provide at least 10 characters');
    return clean.slice(0, 2000);
  }

  async extractWithOpenAI(narrative, userId) {
    const response = await this.client.responses.create({
      model: this.model,
      store: false,
      safety_identifier: crypto.createHash('sha256').update(String(userId)).digest('hex'),
      input: [
        {
          role: 'system',
          content: [
            'Structure a fictional patient intake for clinician review.',
            'Extract only details explicitly present in the text; do not diagnose, prescribe, or decide urgency.',
            'Use unknown values and missing-information questions instead of guessing.',
            'The clinicianDraft must be neutral, concise, and clearly a draft.'
          ].join(' ')
        },
        { role: 'user', content: narrative }
      ],
      max_output_tokens: 1200,
      text: {
        format: {
          type: 'json_schema',
          name: 'patient_intake_draft',
          schema: INTAKE_SCHEMA,
          strict: true
        }
      }
    });

    if (response.status === 'incomplete') throw new Error('Incomplete model response');
    const message = response.output?.find((item) => item.type === 'message');
    const content = message?.content?.find((item) => item.type === 'output_text');
    if (!content?.text) throw new Error('No structured output returned');
    return JSON.parse(content.text);
  }

  createPortfolioDemoIntake(narrative) {
    const lower = narrative.toLowerCase();
    const seen = new Set();
    const symptoms = [];

    for (const [term, label] of SYMPTOM_TERMS) {
      if (lower.includes(term) && !seen.has(label)) {
        seen.add(label);
        symptoms.push({
          name: label,
          duration: this.extractDuration(narrative),
          severity: /(?:severe|very bad|worst)/i.test(narrative) ? 'severe' : 'unknown',
          qualifiers: []
        });
      }
    }

    if (!symptoms.length) {
      symptoms.push({ name: 'Patient-described concern', duration: this.extractDuration(narrative), severity: 'unknown', qualifiers: [] });
    }

    const symptomNames = symptoms.map((symptom) => symptom.name).join(', ');
    return {
      symptoms,
      reportedRedFlags: IMMEDIATE_RULES.filter((rule) => rule.pattern.test(narrative)).map((rule) => rule.label),
      missingInformation: [
        'When did the concern begin and has it changed?',
        'How severe is it on a 0–10 scale?',
        'Are there other symptoms, medicines, allergies, or relevant conditions?'
      ],
      patientFriendlySummary: `Your concern has been organized around: ${symptomNames}. Please check the details before sharing this draft.`,
      clinicianDraft: `Patient reports ${symptomNames}. Duration and severity require confirmation. This draft was generated in free portfolio demo mode.`,
      uncertainty: 'Free demo extraction uses transparent keyword rules; a clinician must verify every field.'
    };
  }

  extractDuration(narrative) {
    const match = narrative.match(/\b(?:for\s+)?(\d+\s*(?:hour|day|week|month)s?|today|yesterday|since\s+\w+)\b/i);
    return match ? match[1] : 'unknown';
  }

  applyDeterministicSafetyRules(narrative, structuredIntake) {
    const safetyText = `${narrative} ${(structuredIntake.reportedRedFlags || []).join(' ')}`;
    const immediateMatches = IMMEDIATE_RULES.filter((rule) => rule.pattern.test(safetyText)).map((rule) => rule.label);
    if (immediateMatches.length) {
      return {
        urgency: 'immediate',
        level: 'critical',
        action: 'Contact local emergency services now. Do not wait for this draft to be reviewed online.',
        matchedRules: [...new Set(immediateMatches)],
        decisionSource: 'deterministic_guardrail'
      };
    }

    const urgentMatches = URGENT_RULES.filter((rule) => rule.pattern.test(safetyText)).map((rule) => rule.label);
    if (urgentMatches.length) {
      return {
        urgency: 'urgent',
        level: 'high',
        action: 'Seek prompt assessment from a qualified healthcare professional.',
        matchedRules: [...new Set(urgentMatches)],
        decisionSource: 'deterministic_guardrail'
      };
    }

    return {
      urgency: 'routine',
      level: 'standard',
      action: 'Review the draft, add missing details, and arrange professional care if symptoms persist or worsen.',
      matchedRules: [],
      decisionSource: 'deterministic_guardrail'
    };
  }
}

module.exports = AIIntakeService;
module.exports.INTAKE_SCHEMA = INTAKE_SCHEMA;
