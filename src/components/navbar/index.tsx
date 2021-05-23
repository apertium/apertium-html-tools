import './navbar.css';

import * as React from 'react';
import BootstrapNavbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from 'react-router-bootstrap';
import Nav from 'react-bootstrap/Nav';

import { ConfigContext } from '../../context';
import { Path as DocTranslationPath } from '../translator/DocTranslationForm';
import LocaleSelector from '../LocaleSelector';
import { Mode } from '../../types';
import { Path as TextTranslationPath } from '../translator/TextTranslationForm';
import { Path as WebpageTranslationPath } from '../translator/WebpageTranslationForm';
import logo from './Apertium_box_white_small.embed.png';
import { useLocalization } from '../../util/localization';

const Logo = (): React.ReactElement => (
  <img
    alt="Apertium Box"
    src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
    style={{
      backgroundImage: `url(${logo})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'auto 3.75em',
      height: '3.65em',
      marginRight: '-.5em',
      verticalAlign: 'text-bottom',
      width: '4.25em',
    }}
  />
);

const TagLine = (): React.ReactElement => {
  const { t } = useLocalization();

  return (
    <p
      style={{
        color: '#fff',
        fontSize: '18px',
        fontWeight: 'bold',
        margin: '0 0 10px',
      }}
    >
      {t('tagline')}
    </p>
  );
};

const NavbarNav: React.ComponentType = () => {
  const { t } = useLocalization();
  const { enabledModes, defaultMode } = React.useContext(ConfigContext);

  if (enabledModes.size === 1) {
    return null;
  }

  return (
    <Nav activeKey={undefined} as="ul" className="mt-1 ml-auto">
      {enabledModes.has(Mode.Translation) && (
        <Nav.Item as="li" className="p-1">
          <LinkContainer
            isActive={(_, { pathname }) =>
              [TextTranslationPath, WebpageTranslationPath, DocTranslationPath].includes(pathname) ||
              (pathname === '/' && defaultMode === Mode.Translation)
            }
            to={TextTranslationPath}
          >
            <Nav.Link>{t('Translation')}</Nav.Link>
          </LinkContainer>
        </Nav.Item>
      )}
      {enabledModes.has(Mode.Analysis) && (
        <Nav.Item as="li" className="p-1">
          <LinkContainer
            isActive={(_, { pathname }) =>
              pathname === '/analysis' || (pathname === '/' && defaultMode === Mode.Analysis)
            }
            to={'/analysis'}
          >
            <Nav.Link>{t('Morphological_Analysis')}</Nav.Link>
          </LinkContainer>
        </Nav.Item>
      )}
      {enabledModes.has(Mode.Generation) && (
        <Nav.Item as="li" className="p-1">
          <LinkContainer
            isActive={(_, { pathname }) =>
              pathname === '/generation' || (pathname === '/' && defaultMode === Mode.Generation)
            }
            to={'/generation'}
          >
            <Nav.Link>{t('Morphological_Generation')}</Nav.Link>
          </LinkContainer>
        </Nav.Item>
      )}
      {enabledModes.has(Mode.Sandbox) && (
        <Nav.Item as="li" className="p-1">
          <LinkContainer
            isActive={(_, { pathname }) =>
              pathname === '/sandbox' || (pathname === '/' && defaultMode === Mode.Sandbox)
            }
            to={'/sandbox'}
          >
            <Nav.Link>{t('APy_Sandbox')}</Nav.Link>
          </LinkContainer>
        </Nav.Item>
      )}
    </Nav>
  );
};

const Navbar = ({ setLocale }: { setLocale: React.Dispatch<React.SetStateAction<string>> }): React.ReactElement => {
  const { subtitle, subtitleColor } = React.useContext(ConfigContext);

  return (
    <BootstrapNavbar bg="dark" className="navbar navbar-default mb-4 pt-0" expand="md" variant="dark">
      <Container className="position-relative" style={{ lineHeight: '1.5em' }}>
        <div>
          <div>
            <Logo />
            {subtitle && (
              <span className="apertium-sublogo" style={subtitleColor ? { color: subtitleColor } : {}}>
                {subtitle}
              </span>
            )}
            <span className="apertium-logo">Apertium</span>
          </div>
          <TagLine />
        </div>
        <div
          className="float-right d-none d-md-block align-self-start"
          style={{
            width: '35%',
          }}
        >
          <LocaleSelector inverse setLocale={setLocale} />
        </div>
        <BootstrapNavbar.Toggle />
        <BootstrapNavbar.Collapse>
          <NavbarNav />
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
