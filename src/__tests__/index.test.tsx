import * as React from 'react';
import { render, screen } from '@testing-library/react';

it('mounts to react-mount', () => {
  render(
    <>
      <meta id="meta-description" name="description" />
      <div id="react-mount" />
    </>,
  );

  jest.isolateModules(() => void require('..'));
  expect(screen.getByRole('img', { name: 'Apertium Box' })).toBeDefined();
});

it('moves actual URL parameters into URL hash', () => {
  window.history.replaceState(null, '', '/?dir=cat-spa');

  render(
    <>
      <meta id="meta-description" name="description" />
      <div id="react-mount" />
    </>,
  );

  jest.isolateModules(() => void require('..'));

  expect(window.location.hash).toContain('dir=cat-spa');
});
