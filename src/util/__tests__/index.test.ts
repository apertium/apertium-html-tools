jest.dontMock('axios');

import type { apyFetch as apyFetchT } from '..';
import axios from 'axios';

describe('apyFetch', () => {
  // eslint-disable-next-line
  const { apyFetch }: { apyFetch: typeof apyFetchT } = require('..');

  it('POSTs to the provided path', async () => {
    const [, response] = apyFetch<{ method: string }>('https://httpbin.org/anything');
    expect((await response).data['method']).toBe('POST');
  });

  it('throws on non-200', async () => {
    const [, response] = apyFetch<{ method: string }>('https://httpbin.org/status/404');
    await expect(response).rejects.toThrowErrorMatchingInlineSnapshot(`"Request failed with status code 404"`);
  });

  it('allows cancelling requests', async () => {
    const [ref, response] = apyFetch<{ method: string }>('https://httpbin.org/delay/10');
    ref.cancel();

    expect.assertions(1);
    try {
      await response;
    } catch (err) {
      // eslint-disable-next-line
      expect(axios.isCancel(err)).toBeTruthy();
    }
  });
});
