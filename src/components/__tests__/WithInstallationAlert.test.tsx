import * as React from 'react';
import { render, screen } from '@testing-library/react';

import WithInstallationAlert from '../WithInstallationAlert';

it('is closed by default', () => {
  render(<WithInstallationAlert />);
  expect(screen.queryAllByRole('alert')).toHaveLength(0);
});

it('renders children', () => {
  render(
    <WithInstallationAlert>
      <main>hello</main>
    </WithInstallationAlert>,
  );
  expect(screen.getByRole('main').textContent).toContain('hello');
});
