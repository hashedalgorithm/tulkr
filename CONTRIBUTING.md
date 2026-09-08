# Contributing to Tulkr

Thanks for taking the time to contribute! The following is a short guide to
get you productive quickly.

## Getting started

```bash
git clone https://github.com/hashedalgorithm/tulkr.git
cd tulkr
yarn install
```

## Development workflow

```bash
yarn dev      # plasmo dev, rebuilds on file changes
yarn build    # plasmo build, production build
yarn package  # plasmo package, zips the extension for distribution
```

To load the extension locally, run `yarn dev` (or `yarn build`), then in
Chrome go to `chrome://extensions`, enable Developer mode, and "Load
unpacked" from `build/chrome-mv3-dev` (or `build/chrome-mv3-prod`).

## Making changes

1. Fork the repo and create a branch off `main`.
2. Make your change, keeping it focused — unrelated refactors make review
   harder.
3. Run `yarn build` locally and load the unpacked extension to verify before
   opening a PR.
4. Open a pull request describing what changed and why. Link any related
   issue.

## Reporting bugs

Please open an issue using the bug report template and include the site the
video was playing on, the `.srt` file (or a minimal snippet) if relevant,
and steps to reproduce.

## Code style

The project uses `prettier` (see `.prettierrc.mjs`), with import sorting via
`@ianvs/prettier-plugin-sort-imports` and Tailwind class sorting via
`prettier-plugin-tailwindcss`. Formatting isn't strictly enforced yet, but
please keep new code consistent with the surrounding style.

## Code of Conduct

This project follows a [Code of Conduct](./CODE_OF_CONDUCT.md). By
participating, you're expected to uphold it.
