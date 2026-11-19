# Milkweed Atlas / Monarch Guardian

This package contains a static GitHub Pages site in `docs/` and a Google Apps Script backend in `apps-script/Code.gs`. Visitors submit observations through the existing Google Form. The form writes directly to the existing response tab. Reviewers approve rows from the private spreadsheet, and the map reads verified reports when a visitor opens or refreshes it.

## 1. Set up Google Sheets and Apps Script

1. As the spreadsheet owner, open your existing **Monarch Guardians (Responses)** spreadsheet. Confirm the target tab is **Form Responses 1**, gid **242823859**. Keep the spreadsheet's **General access** restricted. Review who currently has access before approving any observations.
2. Select **Extensions → Apps Script** to open the spreadsheet-bound project. Copy in `apps-script/Code.gs`. If the project already has code, preserve its functions and integrate any existing `onOpen` or `doGet` before continuing. Save.
3. In the Apps Script editor, select and run **setupAtlas** using the spreadsheet owner's Google account. Follow Google's authorization prompts. Setup checks the response tab and creates a protected **Atlas Approvals** tab. Reload the spreadsheet to see the **Milkweed Atlas** menu.
4. If teachers or coordinators need approval access, give those trusted accounts spreadsheet editor access, then use **Data → Protect sheets and ranges** to add them specifically to the **Atlas Approvals** protection. Keep the entire tab protected, with no unprotected ranges or domain-wide editors. Editors of a bound spreadsheet can also access the workbook's raw data and edit its script source, so grant editor access only to trusted reviewers.
5. In Apps Script choose **Deploy → New deployment → Web app**. Choose **Execute as Me** and **Who has access: Anyone**. The public web app serves only the verified projection. The response spreadsheet stays restricted. Copy the versioned **`/exec`** URL. If the organization blocks anonymous Apps Script deployments, ask its administrator to enable this deployment option before publishing a live feed. [Google Apps Script web app guide](https://developers.google.com/apps-script/guides/web)
6. Open the `/exec` URL in a signed-out or private window. Expect JSON with `ok: true`, a garden directory, and an empty `reports` array until approval. If you see a Google sign-in screen, check the deployment audience. If you see `ok: false`, rerun setup and verify the tab headers and protection.

The public endpoint has no submission or moderation action. It publishes the school identifier, observation date, approved category labels and a bounded sighting count. The observation time, submission timestamp, free-text problem descriptions, reviewer identity and stored fingerprints stay in Sheets. The approved fingerprint is tied to the original response content, so editing the original data requires a fresh approval. Revoke an approval before editing its response if the original values may later be restored.

## 2. Publish GitHub Pages

1. Paste your Google `/exec` URL into `ATLAS_FEED_URL` in `docs/config.js`. The existing public form link is already configured.
2. Create a public GitHub repository, for example **milkweed-atlas**. Upload the contents of the unpacked `milkweed-atlas` folder at the root of the repository on `main`. Preserve the `docs/` structure and its empty `.nojekyll` file. Keep response exports, Google credentials and reviewer information out of the repository.
3. In the repository, go to **Settings → Pages → Deploy from a branch**, choose **main** and **/docs**, then save. Open the URL GitHub shows after publishing. [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
4. Open `g/MG-001/` relative to the published site for the Apex garden. Each garden also has a link such as `?garden=MG-001` that you can copy and use as a QR-code destination once the feed is connected. Old Base44 links continue to point to Base44. Replace the destinations on any existing QR signs where possible.
5. Optional school prefill. In the Google Form editor, use **Get pre-filled link** and set only the school. Add that generated URL to `ATLAS_PREFILLED_FORMS` in `docs/config.js`, keyed by garden ID. Without a prefill URL, the garden view tells the visitor which school to select.

## 3. Review and verify

1. Open the Pages site while signed out. Use **Report an observation** and confirm that the Google Form can submit without a Google account. With the owner's permission, use a clearly labeled test observation and omit personal data. It should appear as a new row in **Form Responses 1** and be absent from the map.
2. As a reviewer, select a cell in the intended source row, or select a contiguous range covering up to 100 reviewed rows. Choose **Milkweed Atlas → Approve selected response rows**. Check school, observation date and the quality of the observation before approval. Unrecognized school values, including arbitrary “Other” entries, and invalid dates are ineligible. Leave demos and spam unapproved.
3. Refresh the site or use **Refresh map**. Verify the correct garden history includes the observation and the marker uses its latest public plant condition. Open the `/exec` JSON and check that private fields are absent.
4. From the same response row, choose **Revoke selected response rows**, then refresh the site. The report should disappear. From an account without reviewer permissions, confirm the approval tab is protected and the private workbook is inaccessible to a signed-out visitor.

## Garden locations and maintenance

The directory supports all ten choices in the existing form. **MG-001** is the existing Apex ID. The Apex marker is approximate, at city level. The other schools have newly assigned IDs and appear in the directory after the feed is connected. Their markers appear after you add school-approved public coordinates to `GARDENS` in `Code.gs`. Use the `aliases` array for alternate school labels. The current Google Form spelling of the Greensboro elementary choice is already accepted.

After changing script code, use **Deploy → Manage deployments → Edit → New version** on the existing deployment to keep the same URL. After changing frontend files, commit them to `main`. The map uses Leaflet and OpenStreetMap tiles. [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)

To preview the static site before publishing, run `python3 -m http.server 8000 --directory docs` from this folder and open `http://localhost:8000/`. The form link works before the verified feed is configured.
