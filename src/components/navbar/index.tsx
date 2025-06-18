import './navbar.css';

import * as React from 'react';
import Nav, { NavProps } from 'react-bootstrap/Nav';
import BootstrapNavbar from 'react-bootstrap/Navbar';
import Container from 'react-bootstrap/Container';
import { LinkContainer } from 'react-router-bootstrap';

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
      className="mb-0"
      style={{
        color: '#fff',
        fontSize: '18px',
        fontWeight: 'bold',
      }}
    >
      {t('tagline')}
    </p>
  );
};

const NavbarNav: React.ComponentType = (props: NavProps) => {
  const { t } = useLocalization();
  const { enabledModes, defaultMode } = React.useContext(ConfigContext);

  if (enabledModes.size === 1) {
    return null;
  }

  return (
    <Nav {...props} activeKey={undefined} as="ul" className="ml-auto">
      {enabledModes.has(Mode.Translation) && (
        <Nav.Item as="li">
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
        <Nav.Item as="li">
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
        <Nav.Item as="li">
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
        <Nav.Item as="li">
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
      {enabledModes.has(Mode.Dictionary) && (
        <Nav.Item as="li">
          <LinkContainer
            isActive={(_, { pathname }) =>
              pathname === '/dictionary' || (pathname === '/' && defaultMode === Mode.Dictionary)
            }
            to={'/dictionary'}
          >
            <Nav.Link>{t('Dictionary')}</Nav.Link>
          </LinkContainer>
        </Nav.Item>
      )}
    </Nav>
  );
};

const Navbar = ({ setLocale }: { setLocale: React.Dispatch<React.SetStateAction<string>> }): React.ReactElement => {
  const { subtitle, subtitleColor, enabledModes } = React.useContext(ConfigContext);

  return (
    <BootstrapNavbar bg="dark" className="navbar navbar-default mb-4 pt-1" expand="md" variant="dark">
      <Container className="position-relative" style={{ lineHeight: '1.5em' }}>
        <div className="d-flex justify-content-between w-100">
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
            <div className="d-flex justify-content-between align-items-center">
              <TagLine />
              {enabledModes.size > 1 && <BootstrapNavbar.Toggle className="ml-3" />}
            </div>
            <div className="d-block d-md-none">
              <BootstrapNavbar.Collapse>
                <NavbarNav data-testid="navbar-mobile" />
              </BootstrapNavbar.Collapse>
            </div>
          </div>
          <div className="d-none d-md-flex flex-column justify-content-between align-self-stretch">
            <LocaleSelector className="float-right" inverse setLocale={setLocale} />
            <NavbarNav data-testid="navbar-desktop" />
          </div>
        </div>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
