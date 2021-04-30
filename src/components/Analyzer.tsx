import * as React from 'react';
import axios, { CancelTokenSource } from 'axios';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Table from 'react-bootstrap/Table';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { MaxURLLength, buildNewSearch, getUrlParam } from '../util/url';
import { langDirection, toAlpha3Code } from '../util/languages';
import { APyContext } from '../context';
import ErrorAlert from './ErrorAlert';
import useLocalStorage from '../util/useLocalStorage';
import { useLocalization } from '../util/localization';

// eslint-disable-next-line
const Analyzers: Readonly<Record<string, string>> = (window as any).ANALYZERS;

const langUrlParam = 'aLang';
const textUrlParam = 'aQ';

const formatUnit = (unit: string) => {
  const tagRegex = /<([^>]+)>/g,
    tags = [];
  let tagMatch = tagRegex.exec(unit);
  while (tagMatch) {
    tags.push(tagMatch[1]);
    tagMatch = tagRegex.exec(unit);
  }

  const tagStartLoc = unit.indexOf('<');
  return (
    unit.substring(0, tagStartLoc !== -1 ? tagStartLoc : unit.length) +
    (tags.length > 0 ? `  ↤  ${tags.join(' ⋅ ')}` : '')
  );
};

const AnalysisResult = ({
  analysis,
  className,
}: {
  analysis: Array<[string, string]>;
  className?: string;
}): React.ReactElement => {
  const unitRegex = /([^<]*)((<[^>]+>)*)/g;

  return (
    <Table className={className} hover>
      <tbody>
        {analysis.map(([unit, stem], i) => {
          const splitUnit = unit.split('/');

          const morphemes: Array<React.ReactElement> = [];
          const joinedMorphemes: Record<string, Array<string>> = {};
          splitUnit.slice(1).forEach((unit, i) => {
            const matches = unit.match(unitRegex);

            if (matches && matches.length > 2) {
              matches.slice(1, matches.length - 1).forEach((match) => {
                if (joinedMorphemes[match]) {
                  joinedMorphemes[match].push(unit);
                } else {
                  joinedMorphemes[match] = [unit];
                }
              });
            } else {
              morphemes.push(<div key={`split-${i}`}>{formatUnit(unit)}</div>);
            }
          });
          Object.entries(joinedMorphemes).forEach(([joinedMorpheme, units], i) => {
            morphemes.push(<div key={`joined-${i}`}>{formatUnit(joinedMorpheme)}</div>);
            units.forEach((unit, j) => {
              const unitMatch = unit.match(unitRegex);
              if (unitMatch) {
                morphemes.push(
                  <div key={`joined-unitt-${j}`} style={{ marginLeft: '30px' }}>
                    {formatUnit(unitMatch[0])}
                  </div>,
                );
              }
            });
          });

          return (
            <tr key={i}>
              <td className="text-right">
                <strong>{stem.trim()}</strong>
                <span>{'  ↬'}</span>
              </td>
              <td
                className={classNames('text-left', {
                  'text-danger': splitUnit[1][0] === '*',
                })}
              >
                {morphemes}
              </td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
};

const AnalysisForm = ({
  setLoading,
  setAnalysis,
  setError,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setAnalysis: React.Dispatch<React.SetStateAction<Array<[string, string]>>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
}): React.ReactElement => {
  const history = useHistory();
  const { t, tLang } = useLocalization();
  const apyFetch = React.useContext(APyContext);

  const [lang, setLang] = useLocalStorage('analyzerLang', Object.keys(Analyzers)[0], {
    overrideValue: toAlpha3Code(getUrlParam(history.location.search, langUrlParam)),
    validateValue: (l) => l in Analyzers,
  });
  const [text, setText] = useLocalStorage('analyzerText', '', {
    overrideValue: getUrlParam(history.location.search, textUrlParam),
  });

  React.useEffect(() => {
    let search = buildNewSearch({ [langUrlParam]: lang, [textUrlParam]: text });
    if (search.length > MaxURLLength) {
      search = buildNewSearch({ [langUrlParam]: lang });
    }
    history.replace({ search });
  }, [history, lang, text]);

  const analysisRef = React.useRef<CancelTokenSource | null>(null);

  const handleSubmit = () => {
    if (text.trim().length === 0) {
      return;
    }

    analysisRef.current?.cancel();
    analysisRef.current = null;

    void (async () => {
      try {
        setLoading(true);
        const [ref, request] = apyFetch('analyze', { lang, q: text });
        analysisRef.current = ref;

        setAnalysis((await request).data as Array<[string, string]>);
        setError(null);
        setLoading(false);

        analysisRef.current = null;
      } catch (error) {
        if (!axios.isCancel(error)) {
          setAnalysis([]);
          setError(error);
          setLoading(false);
        }
      }
    })();
  };

  return (
    <Form aria-label={t('Morphological_Analysis')} onSubmit={(event) => event.preventDefault()}>
      <Form.Group className="row" controlId="analysis-lang">
        <Form.Label className="col-md-2 col-lg-1 col-form-label text-md-right">{t('Language')}</Form.Label>
        <Col md="3">
          <Form.Control as="select" onChange={({ target: { value } }) => setLang(value)} required value={lang}>
            {Object.keys(Analyzers)
              .map((code) => [code, tLang(code)])
              .sort(([, a], [, b]) => {
                return a.toLowerCase().localeCompare(b.toLowerCase());
              })
              .map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
          </Form.Control>
        </Col>
      </Form.Group>
      <Form.Group className="row" controlId="analysis-input">
        <Form.Label className="col-md-2 col-lg-1 col-form-label text-md-right">{t('Input_Text')}</Form.Label>
        <Col md="10">
          <Form.Control
            as="textarea"
            autoFocus
            dir={langDirection(lang)}
            onChange={({ target: { value } }) => setText(value)}
            onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.code === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={t('Morphological_Analysis_Help')}
            required
            rows={5}
            spellCheck={false}
            value={text}
          />
        </Col>
      </Form.Group>
      <Form.Group className="row">
        <Col className="offset-md-2 col-md-10 offset-lg-1" md="10">
          <Button onClick={handleSubmit} type="submit" variant="primary">
            {t('Analyze')}
          </Button>
        </Col>
      </Form.Group>
    </Form>
  );
};

const Analyzer = (): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [analysis, setAnalysis] = React.useState<Array<[string, string]>>([]);
  const [error, setError] = React.useState<Error | null>(null);

  return (
    <>
      <AnalysisForm setAnalysis={setAnalysis} setError={setError} setLoading={setLoading} />
      <div
        className={classNames({
          blurred: loading,
        })}
      >
        {analysis.length ? <AnalysisResult analysis={analysis} /> : null}
        {error && <ErrorAlert error={error} />}
      </div>
    </>
  );
};

export default Analyzer;
