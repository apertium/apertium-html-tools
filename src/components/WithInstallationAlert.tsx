import * as React from 'react';
import type { AxiosPromise, CancelTokenSource } from 'axios';
import Alert from 'react-bootstrap/Alert';

import { APyContext, ConfigContext } from '../context';
import { apyFetch } from '../util';
import { useLocalization } from '../util/localization';

const requestBufferLength = 5,
  individualDurationThreshold = 4000,
  cumulativeDurationThreshold = 3000,
  notificationDuration = 10000;

const InstallationAlert = ({ show, onClose }: { show: boolean; onClose: () => void }): React.ReactElement => {
  const { t } = useLocalization();

  const openTimeoutRef = React.useRef<number | null>(null);

  const scheduleClose = React.useCallback(() => {
    if (!openTimeoutRef.current) {
      openTimeoutRef.current = window.setTimeout(onClose, notificationDuration);
    }
  }, [onClose]);

  React.useEffect(() => {
    const { current } = openTimeoutRef;
    if (show) {
      scheduleClose();
    } else if (current) {
      window.clearTimeout(current);
      openTimeoutRef.current = null;
    }

    return () => {
      if (openTimeoutRef.current) {
        window.clearTimeout(openTimeoutRef.current);
      }
    };
  }, [onClose, scheduleClose, show]);

  const onMouseOver = React.useCallback(() => {
    const { current } = openTimeoutRef;
    if (current) {
      window.clearTimeout(current);
      openTimeoutRef.current = null;
    }
  }, []);

  const onMouseOut = React.useCallback(() => {
    if (show) {
      scheduleClose();
    }
  }, [scheduleClose, show]);

  return (
    <Alert
      aria-hidden={!show}
      className="m-2 p-2 d-md-none d-lg-block"
      dismissible
      onClose={onClose}
      onMouseOut={onMouseOut}
      onMouseOver={onMouseOver}
      show={show}
      style={{ fontSize: 'inherit', position: 'fixed', right: '20px', top: '20px', width: '360px', zIndex: 9999999 }}
      variant="warning"
    >
      <Alert.Heading className="m-0 pb-2">{t('Install_Apertium')}</Alert.Heading>
      <p className="mb-0" dangerouslySetInnerHTML={{ __html: t('Install_Apertium_Para') }} />
    </Alert>
  );
};

const WithInstallationAlert = ({ children }: { children?: React.ReactNode }): React.ReactElement => {
  const { apyURL } = React.useContext(ConfigContext);

  const [show, setShow] = React.useState(false);

  const requestTimings = React.useRef<Array<number>>([]);

  const wrappedApyFetch = React.useCallback(
    <T,>(path: string, params?: Record<string, string>): [CancelTokenSource, AxiosPromise<T>] => {
      const start = Date.now();

      const handleRequestComplete = () => {
        const duration = Date.now() - start;
        const timings = requestTimings.current;

        let cumulativeAPyDuration = 0;

        if (timings.length === requestBufferLength) {
          cumulativeAPyDuration = timings.reduce((totalDuration, duration) => totalDuration + duration);

          timings.shift();
          timings.push(duration);
        } else {
          timings.push(duration);
        }

        const averageDuration = cumulativeAPyDuration / timings.length;

        if (duration > individualDurationThreshold || averageDuration > cumulativeDurationThreshold) {
          setShow(true);
        }
      };

      const [cancel, request] = apyFetch<T>(`${apyURL}/${path}`, params);
      return [cancel, request.finally(handleRequestComplete)];
    },
    [apyURL],
  );

  return (
    <>
      <APyContext.Provider value={wrappedApyFetch}>
        <InstallationAlert onClose={() => setShow(false)} show={show} />
        {children}
      </APyContext.Provider>
    </>
  );
};

export default WithInstallationAlert;
