# Exact-version identity and integrity review

`pg@8.22.0` is the official npm `pg` package and the latest stable version observed on 2026-08-02. It is not deprecated or a prerelease. Registry, homepage, author, maintainer, repository directory, and exact `gitHead` consistently bind it to Brian Carlson's canonical `brianc/node-postgres` project; no repository redirect or typosquat indicator was observed.

The registry supplied SHA-512 integrity, SHA-1 shasum, registry-hosted tarball URL, npm signature/key identifier, 20 files, and 95,249-byte unpacked size. The registry document exposed `_contentLength` 479,959; this is not asserted to be compressed tarball size. The tarball was not downloaded. MIT is compatible with this repository's MIT license.

Identity record canonicalization: parse `OfficialPackageMetadata.json`, serialize with `JSON.stringify` preserving stored key order and UTF-8 encoding, and SHA-256 the resulting bytes. The inventory separately binds the exact file bytes.

Sources: official npm registry metadata and exact upstream manifest at commit `b617619f9fb6fbd231731823e2732a2927ded4be`.
