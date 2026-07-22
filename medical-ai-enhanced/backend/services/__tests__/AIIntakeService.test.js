const test = require('node:test');
const assert = require('node:assert/strict');
const AIIntakeService = require('../AIIntakeService');

const service = new AIIntakeService({ client: null, model: 'test-model' });

test('creates a transparent free-demo draft when no provider is configured', async () => {
  const result = await service.createIntake({
    narrative: 'I have had a headache and nausea for 2 days.',
    userId: 'fictional-user'
  });

  assert.equal(result.generationMode, 'portfolio_demo');
  assert.deepEqual(result.structuredIntake.symptoms.map((item) => item.name), ['Headache', 'Nausea']);
  assert.equal(result.safetyAssessment.decisionSource, 'deterministic_guardrail');
  assert.equal(result.requiresClinicianReview, true);
});

test('deterministic guardrail overrides the draft for emergency language', async () => {
  const result = await service.createIntake({
    narrative: 'I have chest pain and difficulty breathing right now.',
    userId: 'fictional-user'
  });

  assert.equal(result.safetyAssessment.urgency, 'immediate');
  assert.ok(result.safetyAssessment.matchedRules.includes('Chest pain reported'));
  assert.match(result.safetyAssessment.action, /emergency services/i);
});

test('uses Gemini structured output without storing provider requests', async () => {
  let request;
  const client = {
    interactions: {
      create: async (payload) => {
        request = payload;
        return {
          output_text: JSON.stringify({
            symptoms: [{ name: 'Headache', duration: 'today', severity: 'mild', qualifiers: [] }],
            reportedRedFlags: [],
            missingInformation: ['Any other symptoms?'],
            patientFriendlySummary: 'A headache was reported.',
            clinicianDraft: 'Patient reports a mild headache today.',
            uncertainty: 'Cause is not assessed.'
          })
        };
      }
    }
  };

  const liveService = new AIIntakeService({ client, model: 'test-model' });
  const result = await liveService.createIntake({ narrative: 'I have a mild headache today.', userId: 'fictional-user' });

  assert.equal(result.generationMode, 'gemini_structured_output');
  assert.equal(result.model, 'test-model');
  assert.equal(request.store, false);
  assert.equal(request.response_format.type, 'text');
  assert.equal(request.response_format.mime_type, 'application/json');
  assert.deepEqual(request.response_format.schema.required, [
    'symptoms',
    'reportedRedFlags',
    'missingInformation',
    'patientFriendlySummary',
    'clinicianDraft',
    'uncertainty'
  ]);
  assert.match(request.system_instruction, /do not diagnose/i);
});

test('falls back safely when Gemini returns an incomplete structure', async () => {
  const client = {
    interactions: {
      create: async () => ({ output_text: JSON.stringify({ symptoms: [] }) })
    }
  };
  const liveService = new AIIntakeService({ client, model: 'test-model' });
  const originalConsoleError = console.error;
  console.error = () => {};
  let result;
  try {
    result = await liveService.createIntake({ narrative: 'I have a mild headache today.', userId: 'fictional-user' });
  } finally {
    console.error = originalConsoleError;
  }

  assert.equal(result.generationMode, 'portfolio_demo');
  assert.equal(result.structuredIntake.symptoms[0].name, 'Headache');
  assert.equal(result.safetyAssessment.decisionSource, 'deterministic_guardrail');
});
