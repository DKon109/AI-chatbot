-- Patient-submitted AI-assisted intake drafts and clinician review state.
-- The language model structures text; deterministic server rules own urgency.
CREATE TABLE IF NOT EXISTS ai_intake_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    raw_input TEXT NOT NULL,
    structured_intake JSONB NOT NULL,
    safety_assessment JSONB NOT NULL,
    generation_mode VARCHAR(30) NOT NULL,
    model VARCHAR(100),
    review_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (review_status IN ('pending', 'approved', 'needs_changes')),
    clinician_notes TEXT,
    reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_intake_reviews_patient_id
    ON ai_intake_reviews(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_intake_reviews_status_created
    ON ai_intake_reviews(review_status, created_at DESC);

DROP TRIGGER IF EXISTS update_ai_intake_reviews_updated_at ON ai_intake_reviews;
CREATE TRIGGER update_ai_intake_reviews_updated_at
    BEFORE UPDATE ON ai_intake_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
