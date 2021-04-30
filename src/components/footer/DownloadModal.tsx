import * as React from 'react';
import Modal, { ModalProps } from 'react-bootstrap/Modal';

import { useLocalization } from '../../util/localization';

const DownloadModal = (props: ModalProps): React.ReactElement => {
  const { t } = useLocalization();

  return (
    <Modal {...props}>
      <Modal.Header closeButton>
        <Modal.Title>{t('Apertium_Downloads')}</Modal.Title>
      </Modal.Header>
      <Modal.Body dangerouslySetInnerHTML={{ __html: t('Downloads_Para') }} />
    </Modal>
  );
};

export default DownloadModal;
