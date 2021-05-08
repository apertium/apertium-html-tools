import * as React from 'react';
import axios, { CancelTokenSource } from 'axios';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import classNames from 'classnames';
import { useHistory } from 'react-router-dom';

import { MaxURLLength, buildNewSearch, getUrlParam } from '../util/url';
import { langDirection, toAlpha3Code } from '../util/languages';
import { APyContext } from '../context';
import ErrorAlert from './ErrorAlert';
import useLocalStorage from '../util/useLocalStorage';
import { useLocalization } from '../util/localization';

// eslint-disable-next-line
const Generators: Readonly<Record<string, string>> = (window as any).GENERATORS;

const langUrlParam = 'gLang';
const textUrlParam = 'gQ';

const GeneratorForm = ({
  setLoading,
  setGeneration,
  setError,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setGeneration: React.Dispatch<React.SetStateAction<Array<[string, string]>>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
}): React.ReactElement => {
  const { t, tLang } = useLocalization();
  const history = useHistory();
  const apyFetch = React.useContext(APyContext);

  const [lang, setLang] = useLocalStorage('generatorLang', Object.keys(Generators)[0], {
    overrideValue: toAlpha3Code(getUrlParam(history.location.search, langUrlParam)),
    validateValue: (l) => l in Generators,
  });
  const [text, setText] = useLocalStorage('generatorText', '', {
    overrideValue: getUrlParam(history.location.search, textUrlParam),
  });

  React.useEffect(() => {
    let search = buildNewSearch({ [langUrlParam]: lang, [textUrlParam]: text });
    if (search.length > MaxURLLength) {
      search = buildNewSearch({ [langUrlParam]: lang });
    }
    history.replace({ search });
  }, [history, lang, text]);

  const generationRef = React.useRef<CancelTokenSource | null>(null);

  const handleSubmit = () => {
    if (text.trim().length === 0) {
      return;
    }

    generationRef.current?.cancel();
    generationRef.current = null;

    void (async () => {
      try {
        setLoading(true);
        const [ref, request] = apyFetch('generate', { lang, q: text });
        generationRef.current = ref;

        setGeneration((await request).data as Array<[string, string]>);
        setError(null);
        setLoading(false);

        generationRef.current = null;
      } catch (error) {
        if (!axios.isCancel(error)) {
          setGeneration([]);
          setError(error);
          setLoading(false);
        }
      }
    })();
  };

  return (
    <Form aria-label={t('Morphological_Generation')} onSubmit={(event) => event.preventDefault()}>
      <Form.Group className="row" controlId="generator-lang">
        <Form.Label className="col-md-2 col-lg-1 col-form-label text-md-right">{t('Language')}</Form.Label>
        <Col md="3">
          <Form.Control as="select" onChange={({ target: { value } }) => setLang(value)} required value={lang}>
            {Object.keys(Generators)
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
      <Form.Group className="row" controlId="generator-input">
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
            placeholder={t('Morphological_Generation_Help')}
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
            {t('Generate')}
          </Button>
        </Col>
      </Form.Group>
    </Form>
  );
};

const Generator = (): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [generation, setGeneration] = React.useState<Array<[string, string]>>([]);
  const [error, setError] = React.useState<Error | null>(null);

  return (
    <>
      <GeneratorForm setError={setError} setGeneration={setGeneration} setLoading={setLoading} />
      <hr />
      <div
        className={classNames({
          blurred: loading,
        })}
        role="region"
      >
        {generation.map(([analysis, stem], i) => (
          <div key={i}>
            <strong>{stem.trim()}</strong>
            <span>
              {'  ↬  '}
              {analysis}
            </span>
          </div>
        ))}
        {error && <ErrorAlert error={error} />}
      </div>
    </>
  );
};

export default Generator;
