# Milkweed Atlas / Monarch Guardian

This package contains a static GitHub Pages site in `docs/` and a Google Apps Script backend in `apps-script/Code.gs`. Visitors submit observations through the existing Google Form. The form writes directly to the existing response tab. The map reads current submissions through a privacy-filtered Google Apps Script feed.

## 1. Connect the spreadsheet feed

1. Open the existing **Monarch Guardians (Responses)** spreadsheet with an account authorized to edit it and eligible to use Google Apps Script. Keep general access restricted.
2. Choose **Extensions → Apps Script**, then copy in `apps-script/Code.gs`. Preserve unrelated code in any existing script project. Save and run **setupAtlas** once, then authorize Sheets access.
3. Choose **Deploy → New deployment → Web app**. Choose **Execute as Me** and **Who has access: Anyone**. Copy the versioned `/exec` URL. If replacing the earlier code, use **Manage deployments → Edit → New version** to retain an existing endpoint. [Google Apps Script web app guide](https://developers.google.com/apps-script/guides/web)
4. Open the URL in a signed-out window. Expect JSON with `ok: true`, the school directory, and available observations. Paste the URL into `ATLAS_FEED_URL` in `docs/config.js`, then commit to `main`.

The endpoint reads **Form Responses 1** (gid **242823859**) each time it is requested. The site fetches on open, when visitors select Refresh map, and every minute while visible. Matching school submissions with valid dates appear automatically. There is no approval requirement. Free-text responses, submission times, and student information remain in the private spreadsheet. Check the source spreadsheet sharing settings separately from the script deployment.

## 2. Publish GitHub Pages

1. Paste your Google `/exec` URL into `ATLAS_FEED_URL` in `docs/config.js`. The existing public form link is already configured.
2. Create a public GitHub repository, for example **milkweed-atlas**. Upload the contents of the unpacked `milkweed-atlas` folder at the root of the repository on `main`. Preserve the `docs/` structure and its empty `.nojekyll` file. Keep response exports, Google credentials and reviewer information out of the repository.
3. In the repository, go to **Settings → Pages → Deploy from a branch**, choose **main** and **/docs**, then save. Open the URL GitHub shows after publishing. [GitHub Pages publishing guide](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
4. Open `g/MG-001/` relative to the published site for the Apex garden. Each garden also has a link such as `?garden=MG-001` that you can copy and use as a QR-code destination once the feed is connected. Old Base44 links continue to point to Base44. Replace the destinations on any existing QR signs where possible.
5. Optional school prefill. In the Google Form editor, use **Get pre-filled link** and set only the school. Add that generated URL to `ATLAS_PREFILLED_FORMS` in `docs/config.js`, keyed by garden ID. Without a prefill URL, the garden view tells the visitor which school to select.

## 3. Verify new reports

1. Open the Pages site while signed out. Choose **Report an observation** to open the Google Form.
2. Submit a test only when authorized to write to the live response sheet. Use a recognized school, a valid date, and no personal information.
3. Confirm the response appears in **Form Responses 1**, then open that school from **View gardens**. Refresh the map or allow up to one minute while the page is visible. Check the public JSON for the structured report and confirm it omits private fields.

## Garden locations and maintenance

The directory supports all ten choices in the existing form. **MG-001** is the existing Apex ID. The Apex marker is approximate, at city level. The other schools have assigned IDs and appear in the directory even before the feed is connected. Their markers appear after you add school-approved public coordinates to `GARDENS` in `Code.gs`. Use the `aliases` array for alternate school labels. The current Google Form spelling of the Greensboro elementary choice is already accepted.

After changing script code, use **Deploy → Manage deployments → Edit → New version** on the existing deployment to keep the same URL. After changing frontend files, commit them to `main`. The map uses Leaflet and OpenStreetMap tiles. [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)

To preview the static site before publishing, run `python3 -m http.server 8000 --directory docs` from this folder and open `http://localhost:8000/`. The form link works before the spreadsheet feed is configured.
