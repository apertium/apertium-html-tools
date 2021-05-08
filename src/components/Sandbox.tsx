import * as React from 'react';
import axios, { CancelTokenSource } from 'axios';
import Button from 'react-bootstrap/Button';
import Col from 'react-bootstrap/Col';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Form from 'react-bootstrap/Form';
import classNames from 'classnames';
import { faQuestionCircle } from '@fortawesome/free-solid-svg-icons';

import { APyContext } from '../context';
import ErrorAlert from './ErrorAlert';
import useLocalStorage from '../util/useLocalStorage';
import { useLocalization } from '../util/localization';

const SandboxForm = ({
  setLoading,
  setResult,
  setError,
}: {
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setResult: React.Dispatch<React.SetStateAction<[string, number] | null>>;
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
}): React.ReactElement => {
  const { t } = useLocalization();
  const apyFetch = React.useContext(APyContext);

  const [requestText, setRequestText] = useLocalStorage('sandboxRequest', '');

  const requestRef = React.useRef<CancelTokenSource | null>(null);

  const handleSubmit = () => {
    if (requestText.trim().length === 0) {
      return;
    }

    requestRef.current?.cancel();
    requestRef.current = null;

    void (async () => {
      try {
        setLoading(true);
        const [ref, request] = apyFetch(requestText);
        requestRef.current = ref;

        const startTime = Date.now();
        const response = await request;
        const requestTime = Date.now() - startTime;

        setResult([JSON.stringify(response.data, undefined, 3), requestTime]);
        setError(null);
        setLoading(false);

        requestRef.current = null;
      } catch (error) {
        if (!axios.isCancel(error)) {
          setResult(null);
          setError(error);
          setLoading(false);
        }
      }
    })();
  };

  return (
    <Form onSubmit={(event) => event.preventDefault()}>
      <legend>
        <span>{t('APy_Sandbox_Help')}</span>
        <a className="float-right" href="http://wiki.apertium.org/wiki/Apertium-apy" rel="noreferrer" target="_blank">
          <abbr title="Apertium API in Python">APy</abbr> <FontAwesomeIcon icon={faQuestionCircle} />
        </a>
      </legend>
      <Form.Group className="row" controlId="sandbox-input">
        <Form.Label className="col-md-2 col-form-label text-md-right">{t('APy_Request')}</Form.Label>
        <Col md="10">
          <Form.Control
            as="textarea"
            autoFocus
            onChange={({ target: { value } }) => setRequestText(value)}
            onKeyDown={(event: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (event.code === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            required
            rows={3}
            spellCheck={false}
            value={requestText}
          />
          <div className="form-text text-muted">
            {'e.g. /perWord?lang=en-es&amp;modes=morph+translate+biltrans&amp;q=let+there+be+light'}
          </div>
        </Col>
      </Form.Group>
      <Form.Group className="row">
        <Col className="offset-md-2 col-md-10 offset-lg-1" md="10">
          <Button onClick={handleSubmit} type="submit" variant="primary">
            {t('Request')}
          </Button>
        </Col>
      </Form.Group>
    </Form>
  );
};

const Sandbox = (): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<[string, number] | null>(null);
  const [error, setError] = React.useState<Error | null>(null);

  return (
    <>
      <SandboxForm setError={setError} setLoading={setLoading} setResult={setResult} />
      <hr />
      <div
        className={classNames({
          blurred: loading,
        })}
      >
        {result && (
          <>
            <code className="float-right">
              {result[1]}
              {'ms'}
            </code>
            <pre>{result[0]}</pre>
          </>
        )}
        {error && <ErrorAlert error={error} />}
      </div>
    </>
  );
};

export default Sandbox;
