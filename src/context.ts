import * as React from 'react';

import Config from '../config';
import { PRELOADED_STRINGS } from './util/strings';
import { apyFetch } from './util';
import { initialTextValues } from './util/initialTextValues';

const LocaleContext = React.createContext(Config.defaultLocale);
const ConfigContext = React.createContext(Config);
const StringsContext = React.createContext(PRELOADED_STRINGS);
const APyContext = React.createContext(apyFetch);
const TextContext = React.createContext(initialTextValues);

export { APyContext, ConfigContext, LocaleContext, StringsContext, TextContext };
