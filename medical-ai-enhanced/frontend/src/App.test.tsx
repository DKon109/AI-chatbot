import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the MedAI Pro landing page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Secure Healthcare Workflow' })).toBeInTheDocument();
  expect(screen.getByText(/AI-assisted intake · Deterministic safety · Clinician review/i)).toBeInTheDocument();
});
