# Vercel Source Fetcher

![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

## Instructions

1 - Install the dependencies.

```sh
npm install
```

or use recommended package manager Bun

```sh
bun install
```

2 - Get your Vercel token at <https://vercel.com/account/tokens>, copy `.env.sample` as `.env` and insert token:

```text
# .env
VERCEL_TOKEN = ""
VERCEL_TEAM = ""
```

3 - Run the script and wait until complete.

```sh
node index.js <VERCEL DEPLOYMENT URL or ID> <DESTINATION>
```

For example, `node index.js example-5ik51k4n7.vercel.app ../example`.

Or using the id directly, `node index.js dpl_6CR1uw9hBdpWgrMvPkncsTGRC18A ../example`.

## Colophon 📜

### Acknowledgement

This is an updated version of

- [zehfernandes/get-vercel-source-code](https://github.com/zehfernandes/get-vercel-source-code) 👍
- [Vercel API]

[vercel api]: https://vercel.com/docs/rest-api
