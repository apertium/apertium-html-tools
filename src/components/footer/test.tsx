import * as React from 'react';
import { getAllByRole, render, screen } from '@testing-library/react';

import Footer from '.';

describe('Footer', () => {
  it('renders with navigation buttons', () => {
    const wrapRef = React.createRef<HTMLElement>();
    const pushRef = React.createRef<HTMLElement>();
    render(<Footer pushRef={pushRef} wrapRef={wrapRef} />);

    const navigation = screen.getByRole('navigation');
    const buttons = getAllByRole(navigation, 'button');
    expect(buttons).toHaveLength(4);
  });
});
