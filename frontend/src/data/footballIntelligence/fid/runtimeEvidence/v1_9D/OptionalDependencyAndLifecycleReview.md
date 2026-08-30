# Optional dependency and lifecycle review

- `pg-cloudflare@1.4.0`: lockfile optional flag true; installed locally.
- `pg-native`: optional peer declaration exists; package is absent.
- Native compilation: no native package in this introduced tree, no install-script metadata, and no compilation/lifecycle message in the capture. No evidence of native compilation.
- Lifecycle: installed package metadata contains no preinstall/install/postinstall/prepare scripts. pg contains only a test script. The lockfile has no `hasInstallScript` on any introduced entry. Therefore no introduced-tree lifecycle script was eligible to run; the lack of output corroborates rather than solely proves the result.

