# Publishing

Two GitHub Actions workflows build leauto:

- **CI** (`.github/workflows/ci.yml`) runs `npm run check` (typecheck, fixture lint, unit and end-to-end tests) and the Edge build on every push to `main` and every pull request.
- **Release** (`.github/workflows/release.yml`) runs on a `v*` tag. It runs the same checks, zips the Chrome and Edge builds, creates a GitHub Release with both zips attached, and submits to every store whose secrets are configured. A store without secrets is skipped.

## Cutting a release

1. Bump `version` in `package.json` (WXT copies it into the manifest), commit and push.
2. Tag the commit with the same version and push the tag:

   ```sh
   git tag v0.2.0
   git push origin v0.2.0
   ```

The workflow fails if the tag doesn't match `package.json`.

To check store credentials without uploading anything, run **Release** manually from the Actions tab with **dry-run** ticked (the default). A manual run never creates a GitHub Release.

## Listing assets

- **Privacy policy URL** (both stores): <https://github.com/albal/leauto/blob/main/PRIVACY.md>
- **Extension icons**: `public/icon/{16,32,48,128}.png`, rendered from `assets/icon.svg` with `npm run icons`. Re-run that after changing the SVG, and commit the PNGs.
- **Edge store logo (300×300)**: `assets/store/edge-logo-300.png`, rendered by the same script.
- **Screenshots** (1280×800): still to do. Use invented messages, never real conversations.

## One-time store setup

Neither store's API can create a new listing, so the first version of each must be uploaded by hand. After that, the workflow handles updates.

### Chrome Web Store (API v2, service account)

1. In the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), create the item by uploading `leauto-<version>-chrome.zip` from a GitHub Release, and complete the listing and privacy tabs.
2. In Google Cloud, enable the Chrome Web Store API, create a service account, and create a JSON key for it.
3. In the Developer Dashboard's account settings, add the service account's email as a member of your publisher account.
4. Add these repository secrets (Settings → Secrets and variables → Actions):

   | Secret | Value |
   | --- | --- |
   | `CHROME_EXTENSION_ID` | The item's ID from the dashboard |
   | `CHROME_PUBLISHER_ID` | Your publisher ID from the dashboard |
   | `CHROME_SERVICE_ACCOUNT_CLIENT_EMAIL` | `client_email` from the JSON key |
   | `CHROME_SERVICE_ACCOUNT_PRIVATE_KEY` | `private_key` from the JSON key |

### Microsoft Edge Add-ons

1. In [Partner Center](https://partner.microsoft.com/dashboard/microsoftedge), create the extension by uploading `leauto-<version>-edge.zip`, and complete the listing.
2. Under **Publish API**, enable the API and create an API key.
3. Add these repository secrets:

   | Secret | Value |
   | --- | --- |
   | `EDGE_PRODUCT_ID` | The extension's product ID |
   | `EDGE_CLIENT_ID` | The client ID on the Publish API page |
   | `EDGE_API_KEY` | The API key |
