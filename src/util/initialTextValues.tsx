import React, { ReactNode } from 'react';
import { useHistory } from 'react-router-dom';

import { TextContext } from '../context';
import { TextType } from '../types';
import { getUrlParam } from '../util/url';

import useLocalStorage from '../util/useLocalStorage';

export const initialTextValues: TextType = {
  srcText: '',
  setSrcText: () => {
    initialTextValues.srcText = ' Source Text';
  },
  tgtText: '',
  setTgtText: () => {
    initialTextValues.tgtText = 'Target Text';
  },
};

export const TextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const textUrlParam = 'q';
  const history = useHistory();
  const [srcText, setSrcText] = useLocalStorage('srcText', '', {
    overrideValue: getUrlParam(history.location.search, textUrlParam),
  });
  const [tgtText, setTgtText] = React.useState('');

  return <TextContext.Provider value={{ srcText, setSrcText, tgtText, setTgtText }}>{children}</TextContext.Provider>;
};
