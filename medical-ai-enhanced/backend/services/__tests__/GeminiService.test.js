const test = require('node:test');
const assert = require('node:assert/strict');
const GeminiService = require('../GeminiService');

test('keeps doctor instructions usable without an external provider', async () => {
  const service = new GeminiService({ client: null, model: 'test-model' });
  const result = await service.generatePersonalizedAgent(
    { conditions: ['fictional condition'], medications: [], allergies: [] },
    { dietary: 'Use the fictional meal plan.', monitoring: 'Record the fictional metric.' }
  );

  assert.equal(result.generationMode, 'deterministic');
  assert.equal(result.diet, 'Use the fictional meal plan.');
  assert.equal(result.monitoring, 'Record the fictional metric.');
  assert.equal(result.requiresClinicianReview, true);
});

test('creates a clinician-reviewed guidance profile with Gemini structured output', async () => {
  let request;
  const client = {
    interactions: {
      create: async (payload) => {
        request = payload;
        return {
          output_text: JSON.stringify({
            diet: 'Follow the doctor-authored fictional meal plan.',
            exercise: 'Discuss walking with the clinician.',
            medications: 'Keep the recorded reminder unchanged.',
            monitoring: 'Record the fictional metric.',
            goals: 'Review progress at the next appointment.',
            restrictions: 'No additional restrictions were supplied.',
            emergency: 'Follow the doctor-authored emergency instructions.',
            metrics: ['fictional metric']
          })
        };
      }
    }
  };
  const service = new GeminiService({ client, model: 'test-model' });
  const result = await service.generatePersonalizedAgent(
    { conditions: [], medications: [], allergies: [] },
    { monitoring: 'Record the fictional metric.' }
  );

  assert.equal(result.generationMode, 'gemini_structured_output');
  assert.equal(result.model, 'test-model');
  assert.equal(result.requiresClinicianReview, true);
  assert.equal(request.store, false);
  assert.equal(request.response_format.mime_type, 'application/json');
  assert.match(request.system_instruction, /doctor instructions are authoritative/i);
});

test('removes account identifiers before progress data is sent to Gemini', async () => {
  let request;
  const client = {
    interactions: {
      create: async (payload) => {
        request = payload;
        return {
          output_text: JSON.stringify({
            summary: 'Fictional progress summary.',
            observedTrends: [],
            progressTowardGoals: [],
            questionsForClinician: [],
            nextReviewTopics: []
          })
        };
      }
    }
  };
  const service = new GeminiService({ client, model: 'test-model' });
  await service.generateProgressReport({
    symptomLogs: [{ id: 'log-id', user_id: 'account-id', email: 'fictional@example.com', symptom: 'headache' }]
  }, {}, 'weekly');

  assert.doesNotMatch(request.input, /account-id|fictional@example\.com|log-id/);
  assert.match(request.input, /headache/);
});
