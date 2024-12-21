# Vercel Source Fetcher

[![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

## Instructions

1 - Install with recommended package manager `Bun` or any other like `npm`, `pnpm` or `Yarn`


```sh
bun install --global vscdl
```

Or just kickstart it without installation to your system, use `npx`, `pnpx` or `yarn dlx` accordingly 

```sh
bunx vscdl --help
```

2 - Get your Vercel token at <https://vercel.com/account/tokens>, copy `.env.sample` as `.env` and insert token:

```txt
# .env
VERCEL_TOKEN=
VERCEL_TEAM=
```

3 - Run the script and wait until complete.

```sh
vscdl <vercel deployment URL or ID> [<destination path>]
```

Examples

- Use prod url `vscdl getsource.vercel.app`
- Or deployment id, `vscdl dpl_id0wn104d ../example`.

## Colophon 📜

This is an updated version of

- [zehfernandes/get-vercel-source-code](https://github.com/zehfernandes/get-vercel-source-code) 👍
- [Vercel API]

[vercel api]: https://vercel.com/docs/rest-api
