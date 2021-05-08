# Apertium Html-tools

[![Build
Status](https://github.com/sushain97/apertium-html-tools-v2/workflows/Check/badge.svg?branch=master)](https://github.com/sushain97/apertium-html-tools-v2/actions/workflows/check.yml?query=branch%3Amaster)
[![Coverage Status](https://coveralls.io/repos/github/sushain97/apertium-html-tools-v2/badge.svg?branch=master)](https://coveralls.io/github/sushain97/apertium-html-tools-v2?branch=master)

[Apertium Html-tools][1] is a web application providing a fully localised
interface for text/document/website translation, analysis, and generation
powered by [Apertium][2]. Html-tools relies on an Apertium HTTP API such as
[Apertium-apy][3] or [ScaleMT][4] (to a lesser extent). More information along
with instructions for localization is available on the [Apertium Wiki][5].

## Configuration

Configure the build by editing `config.ts`.

## Dependencies

### Development

Our sources are written in [TypeScript][6].

Development requires installing [Node.js][7] and [Yarn][8]. After installing
both, use `yarn install --dev` to install JavaScript packages. We use
[ESLint][9] & [Stylelint][10] for linting, [Prettier][11] for code formatting
and [Jest][12] as a test runner.

### Runtime

We use a variety of JS libraries at runtime:

- [React](https://reactjs.org/)
- [React-Bootstrap](https://react-bootstrap.netlify.app/)
- [Font Awesome](https://fontawesome.com/)
- [React Router](https://reactrouter.com/)

To avoid distributing hundreds of JS files, we use [esbuild][13] to bundle
sources into browser-ready JS.

## Building

First, follow the development instructions. Then, running `yarn build` will
output built bundles to `dist/`. Use `--prod` to minify bundles. Any web server
capable of serving static assets can be pointed directly to `dist/`.

Alternatively, if you'd like to avoid polluting your host system with build
dependencies, use Docker:

    docker build -t apertium-html-tools .
    docker run --rm -v $(pwd)/dist:/root/dist apertium-html-tools

## Contributing

- Use `yarn build --watch` to keep `dist/` up-to-date with new bundles.
- Use `yarn serve` to run a simple Python server which serves `dist/` on
  `localhost:8000`.
- Use `yarn verify` to run the typechecker, linters and tests. See
  `package.json` for more granular scripts.

To analyze the bundle size, run a prod build and upload the resulting
`meta.json` file to [Bundle Buddy][14].

We use [GitHub Actions][15] to run tests, linting, typechecking, etc. on each
commit.

[1]: http://wiki.apertium.org/wiki/Apertium-html-tools
[2]: http://apertium.org
[3]: http://wiki.apertium.org/wiki/Apertium-apy
[4]: http://wiki.apertium.org/wiki/ScaleMT
[5]: http://wiki.apertium.org/wiki/Apertium-html-tools
[6]: https://www.typescriptlang.org/
[7]: https://nodejs.org/en/download/
[8]: https://classic.yarnpkg.com/en/docs/install
[9]: https://eslint.org/
[10]: https://stylelint.io/
[11]: https://prettier.io/
[12]: https://jestjs.io/
[13]: https://esbuild.github.io/
[14]: https://bundle-buddy.com/
[15]: https://docs.github.com/actions
