import * as React from 'react';
import Modal, { ModalProps } from 'react-bootstrap/Modal';

import { useLocalization } from '../../util/localization';

const ContactModal = (props: ModalProps): React.ReactElement => {
  const { t } = useLocalization();

  return (
    <Modal {...props}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Contact')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{t('Contact_Us')}</p>
        <div dangerouslySetInnerHTML={{ __html: t('Contact_Para') }} />
      </Modal.Body>
    </Modal>
  );
};

export default ContactModal;
