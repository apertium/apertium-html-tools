import * as React from 'react';
import { render } from '@testing-library/react';

import App from '../App';

it('sets document level attributes', () => {
  render(
    <>
      <meta id="meta-description" name="description" />
      <App />
    </>,
  );

  expect(document.title).toMatchInlineSnapshot(`"title-Default"`);

  const html = document.getElementsByTagName('html')[0];
  expect(html.dir).toBe('ltr');
  expect(html.lang).toBe('en');

  expect((document.getElementById('meta-description') as HTMLMetaElement).content).toMatchInlineSnapshot(
    `"description-Default"`,
  );
});
