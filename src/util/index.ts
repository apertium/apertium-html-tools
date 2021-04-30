import * as queryString from 'query-string';
import axios, { AxiosPromise, CancelTokenSource } from 'axios';

import Config from '../../config';

export const apyFetch = (path: string, params?: Record<string, string>): [CancelTokenSource, AxiosPromise<unknown>] => {
  const source = axios.CancelToken.source();

  return [
    source,
    axios.post(`${Config.apyURL}/${path}`, params ? queryString.stringify(params) : '', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cancelToken: source.token,
      validateStatus: (status) => status === 200,
    }),
  ];
};
