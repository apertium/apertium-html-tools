import * as React from 'react';
import { render, screen } from '@testing-library/react';

import ErrorAlert from './ErrorAlert';

it('shows generic errors', () => {
  render(<ErrorAlert error={new Error('Network Error')} />);

  const error = screen.getByRole('alert');
  expect(error.textContent).toContain('Network Error');
});
