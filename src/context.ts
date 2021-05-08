import * as React from 'react';

import Config from '../config';
import { PRELOADED_STRINGS } from './util/strings';
import { apyFetch } from './util';

const LocaleContext = React.createContext(Config.defaultLocale);
const ConfigContext = React.createContext(Config);
const StringsContext = React.createContext(PRELOADED_STRINGS);
const APyContext = React.createContext(apyFetch);

export { APyContext, ConfigContext, LocaleContext, StringsContext };
