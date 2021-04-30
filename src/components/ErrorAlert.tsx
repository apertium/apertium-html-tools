import * as React from 'react';
import Alert from 'react-bootstrap/Alert';
import { AxiosError } from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const isAxiosError = (error: Error): error is AxiosError => (error as AxiosError).isAxiosError;

const ErrorAlert = ({ error }: { error: Error }): React.ReactElement => {
  let errorText = error.toString();
  if (
    isAxiosError(error) &&
    error.response &&
    error.response['data'] &&
    (error.response['data'] as { explanation?: string }).explanation
  ) {
    errorText = (error.response['data'] as { explanation: string }).explanation;
  }
  return (
    <Alert variant="danger">
      <FontAwesomeIcon icon={faExclamationTriangle} /> {errorText}
    </Alert>
  );
};

export default ErrorAlert;
