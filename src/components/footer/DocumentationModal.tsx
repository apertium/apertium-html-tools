import * as React from 'react';
import Modal, { ModalProps } from 'react-bootstrap/Modal';

import { useLocalization } from '../../util/localization';

const DocumentationModal = (props: ModalProps): React.ReactElement => {
  const { t } = useLocalization();

  return (
    <Modal {...props}>
      <Modal.Header closeButton>
        <Modal.Title>Apertium Documentation</Modal.Title> {/* TODO: BUG */}
      </Modal.Header>
      <Modal.Body dangerouslySetInnerHTML={{ __html: t('Documentation_Para') }} />
    </Modal>
  );
};

export default DocumentationModal;
