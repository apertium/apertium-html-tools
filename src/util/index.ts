import * as queryString from 'query-string';
import axios, { AxiosPromise, CancelTokenSource } from 'axios';

export const apyFetch = <T extends unknown>(
  path: string,
  params?: Record<string, string>,
): [CancelTokenSource, AxiosPromise<T>] => {
  const source = axios.CancelToken.source();

  return [
    source,
    axios.post(path, params ? queryString.stringify(params) : '', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      cancelToken: source.token,
      validateStatus: (status) => status === 200,
    }),
  ];
};
