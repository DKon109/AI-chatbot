import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the MedAI Pro landing page', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: 'Medical AI Assistant' })).toBeInTheDocument();
});
