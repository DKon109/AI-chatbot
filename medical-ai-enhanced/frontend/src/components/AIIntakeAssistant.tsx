import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, ShieldCheck, Sparkles } from 'lucide-react';
import ApiService from '../services/api';

interface IntakeSymptom {
  name: string;
  duration: string;
  severity: string;
  qualifiers: string[];
}

interface IntakeResult {
  id: string;
  reviewStatus: 'pending' | 'approved' | 'needs_changes';
  structuredIntake: {
    symptoms: IntakeSymptom[];
    reportedRedFlags: string[];
    missingInformation: string[];
    patientFriendlySummary: string;
    clinicianDraft: string;
    uncertainty: string;
  };
  safetyAssessment: {
    urgency: 'immediate' | 'urgent' | 'routine';
    level: string;
    action: string;
    matchedRules: string[];
    decisionSource: string;
  };
  generationMode: 'gemini_structured_output' | 'portfolio_demo';
  model: string | null;
  disclaimer: string;
}

const exampleNarratives = [
  'I have had a headache and nausea for 2 days. The headache feels worse this morning.',
  'I have chest pain and difficulty breathing right now.'
];

const AIIntakeAssistant: React.FC = () => {
  const [narrative, setNarrative] = useState('');
  const [result, setResult] = useState<IntakeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (narrative.trim().length < 10) {
      setError('Please add a little more detail before creating the draft.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await ApiService.createAIIntake(narrative.trim());
      if (!response.success) throw new Error(response.error || 'The intake could not be created.');
      setResult(response.data);
    } catch (requestError: any) {
      setError(requestError?.response?.data?.error || requestError.message || 'The intake assistant is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="ai-intake-card" aria-labelledby="ai-intake-title">
      <div className="ai-intake-heading">
        <div className="ai-intake-icon"><Sparkles size={22} /></div>
        <div>
          <span className="symptom-eyebrow">AI-ASSISTED INTAKE · OPTIONAL</span>
          <h2 id="ai-intake-title">Describe your concern in your own words</h2>
          <p>The assistant organizes your text into a draft. Safety urgency is checked separately by fixed rules, and a clinician must review the result.</p>
        </div>
      </div>

      <label className="ai-intake-label" htmlFor="intake-narrative">What are you experiencing?</label>
      <textarea
        id="intake-narrative"
        value={narrative}
        maxLength={2000}
        rows={5}
        onChange={(event) => setNarrative(event.target.value)}
        placeholder="Example: I have had a headache and nausea for two days. It feels worse this morning..."
      />
      <div className="ai-intake-meta">
        <div className="ai-example-row">
          <span>Try a fictional example:</span>
          {exampleNarratives.map((example, index) => (
            <button type="button" key={example} onClick={() => { setNarrative(example); setResult(null); }}>
              {index === 0 ? 'Routine concern' : 'Safety guardrail'}
            </button>
          ))}
        </div>
        <span>{narrative.length}/2000</span>
      </div>

      {error && <div className="ai-intake-error" role="alert">{error}</div>}

      <button className="ai-intake-submit" type="button" onClick={submit} disabled={isLoading || narrative.trim().length < 10}>
        <Sparkles size={17} /> {isLoading ? 'Creating review draft…' : 'Create AI-assisted draft'}
      </button>

      {result && (
        <div className="ai-intake-result" aria-live="polite">
          <div className="ai-result-toolbar">
            <span className={`ai-mode-badge ${result.generationMode === 'gemini_structured_output' ? 'is-live' : ''}`}>
              {result.generationMode === 'gemini_structured_output' ? 'Gemini structured AI' : 'Free portfolio demo'}
            </span>
            <span className="review-badge"><ClipboardList size={14} /> Clinician review: pending</span>
          </div>

          <div className={`safety-result is-${result.safetyAssessment.urgency}`}>
            {result.safetyAssessment.urgency === 'immediate' ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
            <div>
              <strong>{result.safetyAssessment.urgency === 'immediate' ? 'Immediate safety action' : 'Deterministic safety check'}</strong>
              <p>{result.safetyAssessment.action}</p>
              <small>Decision source: fixed, testable guardrail rules — not the language model.</small>
            </div>
          </div>

          <div className="ai-result-grid">
            <div>
              <h3>Structured symptoms</h3>
              {result.structuredIntake.symptoms.map((symptom, index) => (
                <div className="intake-symptom" key={`${symptom.name}-${index}`}>
                  <CheckCircle2 size={16} />
                  <span><strong>{symptom.name}</strong><small>{symptom.duration} · {symptom.severity}</small></span>
                </div>
              ))}
            </div>
            <div>
              <h3>Details to confirm</h3>
              <ul>{result.structuredIntake.missingInformation.map((item) => <li key={item}>{item}</li>)}</ul>
            </div>
          </div>

          <div className="clinician-draft">
            <span>DRAFT FOR CLINICIAN REVIEW</span>
            <p>{result.structuredIntake.clinicianDraft}</p>
          </div>
          <p className="ai-intake-disclaimer">{result.disclaimer}</p>
        </div>
      )}
    </section>
  );
};

export default AIIntakeAssistant;
