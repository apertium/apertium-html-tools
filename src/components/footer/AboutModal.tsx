import * as React from 'react';
import Modal, { ModalProps } from 'react-bootstrap/Modal';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

import { ConfigContext } from '../../context';
import { useLocalization } from '../../util/localization';

import alicanteLogo from './img/logouapp.gif';
import bytemarkLogo from './img/logo_bytemark.gif';
import catalunyaLogo from './img/stsi.gif';
import ccLogo from './img/cc-by-sa-3.0-88x31.png';
import gciLogo from './img/GCI_logo.png';
import githubLogo from './img/github.png';
import gplLogo from './img/gplv3-88x31.png';
import gsocLogo from './img/GSOC_logo.svg';
import maeLogo from './img/logo_mae_ro_75pc.jpg';
import mineturLogo from './img/logomitc120.jpg';
import prompsitLogo from './img/prompsit150x52.png';

const AboutModal = (props: ModalProps): React.ReactElement => {
  const config = React.useContext(ConfigContext);
  const { t } = useLocalization();

  return (
    <Modal {...props} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{t('About_Apertium')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p dangerouslySetInnerHTML={{ __html: t('What_Is_Apertium') }} />
        <p dangerouslySetInnerHTML={{ __html: t('Maintainer') }} />
        {config.showMoreLanguagesLink && <p dangerouslySetInnerHTML={{ __html: t('More_Languages') }} />}

        <Row className="lead">
          <Col md="6">
            <div className="mx-auto">
              <a href="https://developers.google.com/open-source/soc/" rel="noreferrer" target="_blank">
                <img alt="Google Summer of Code" src={gsocLogo} style={{ height: '1.75em' }} />
              </a>
              <a href="https://developers.google.com/open-source/gci/" rel="noreferrer" target="_blank">
                <img alt="Google Code-In" src={gciLogo} style={{ height: '2.5em', paddingLeft: '0.5em' }} />
              </a>
            </div>
          </Col>

          <Col className="text-center" md="3">
            <a href="http://www.bytemark.co.uk/" rel="noreferrer" target="_blank">
              <img alt="Bytemark" className="w-100" src={bytemarkLogo} />
            </a>
          </Col>
          <Col className="text-center" md="3">
            <a href="https://www.github.com/apertium" rel="noreferrer" target="_blank">
              <img alt="GitHub" src={githubLogo} style={{ height: '1.5em' }} />
            </a>
          </Col>
        </Row>

        <Row className="lead">
          <Col className="text-center" md="6">
            <a href="http://www.minetur.gob.es/" rel="noreferrer" target="_blank">
              <img alt="Ministry of Industry, Energy and Tourism" src={mineturLogo} />
            </a>
          </Col>
          <Col className="text-center" md="6">
            <a href="http://www.ua.es/" rel="noreferrer" target="_blank">
              <img alt="Universidad de Alicante" src={alicanteLogo} />
            </a>
          </Col>
        </Row>

        <Row>
          <Col className="text-center" md="4">
            <a href="http://www.prompsit.com/" rel="noreferrer" target="_blank">
              <img alt="Prompsit Language Engineering S.L." src={prompsitLogo} />
            </a>
          </Col>
          <Col className="text-center" md="4">
            <a href="http://www10.gencat.net" rel="noreferrer" target="_blank">
              <img alt="Generalitat de Catalunya" src={catalunyaLogo} />
            </a>
          </Col>
          <Col className="text-center" md="4">
            <a href="http://www.mae.ro/" rel="noreferrer" target="_blank">
              <img alt="ROMÂNIA  Ministerul Afacerilor Externe" src={maeLogo} style={{ height: '5em' }} />
            </a>
          </Col>
        </Row>

        <Row>
          <div className="d-inline-block mx-2">
            <a href="http://creativecommons.org/licenses/by-sa/3.0/">
              <img alt="Creative Commons licence" src={ccLogo} />
            </a>
          </div>

          <div className="d-inline-block mx-2">
            <a href="https://www.gnu.org/licenses/gpl.html">
              <img alt="GNU GPL License" src={gplLogo} />
            </a>
          </div>
        </Row>
      </Modal.Body>
    </Modal>
  );
};

export default AboutModal;
