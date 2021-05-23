import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './App';

// `BrowserRouter` uses the `history` library underneath which persists
// `window.location.search` inside the hash rather than as proper query
// parameters. While this behavior isn't a problem per se, it conflicts with the
// pre-v5 URL scheme. For backwards compatibility, we convert forwards here.
const { search } = window.location;
if (search.length) {
  window.history.pushState({}, '', `${window.location.pathname}${window.location.hash || '#'}${search}`);
}

ReactDOM.render(<App />, document.getElementById('react-mount'));
