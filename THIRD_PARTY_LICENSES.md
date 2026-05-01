# Third-Party Licenses

This project is licensed under the MIT License. See [LICENSE](./LICENSE).

Dependencies used by this project may be licensed under other open-source licenses
(such as MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, or MPL-2.0).

## How to Generate a Dependency License Report

From the repository root, run:

```bash
npx license-checker --production --summary
```

For a full JSON report:

```bash
npx license-checker --production --json > third-party-licenses.json
```

## Attribution Notes

- Copyright and license terms for third-party packages remain with their
  respective authors.
- If you distribute this project, ensure you comply with the license terms of
  all included dependencies.
