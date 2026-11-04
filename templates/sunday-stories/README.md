# Sunday Stories

A caregiver desk, a storyteller’s recorder and a child's guided activity share one small web app. Two story prompts and two three-step learning cards ship with the kit. No account, API key, build framework or external font is required for the public interface.

## Try the family flow

1. Open the desk. Choose an activity and prepare a setup link. Open that link on a second browser or phone.
2. Choose **Use on this phone**. The phone remembers its starting screen. Read back the code under **Keep this activity on your phone** and confirm it on the desk. Anyone who possesses the link can see the code. This is an acknowledgement, never an identity or device credential. Expiry limits the handoff, and forgetting an entry clears the local notebook only.
3. The storyteller presses **Record my story**, stops, listens and then downloads or shares the audio file. They can discard the take or write a story instead. A take lives in memory and may be lost when the tab or browser closes. The chosen destination controls the saved copy. Download the optional source note beside the audio to preserve the original prompt, media type, capture end time, byte count and SHA-256. It identifies an unreviewed recollection.
4. For a child, select a built-in field card, or use **Prepare a card with a parent or teacher**. An adult can write five lines or take the supplied generic brief into an eligible adult AI account. Review the complete text, export a JSON card and transfer it yourself. On the receiving device, open the desk at `?view=desk`, review the file, then activate it. The approved card starts on the next visit. Use the same desk to clear it. Card text is data rendered as text. The child view never calls a model.
5. Choose the visit time. Download the calendar event with its 15-minute reminder or open a Google Calendar draft. The calendar owner confirms delivery, recurrence and guest settings inside their calendar. Drive and Notion open separately. The desk can also preview the next six simple visits from a chosen .ics export in memory. It omits recurring and cancelled events, floating and TZID times, and ambiguous duplicate UIDs. Dates and UTC instants are supported. Import a fresh file to refresh. No provider OAuth or automatic synchronization is active.

Use HTTPS. To try locally, run `python3 -m http.server 8000 --directory public` and open localhost. Mobile installation uses the browser’s install or Add to Home Screen flow. Storage and home-screen behavior must be tested on the target device. Offline relaunch is outside this release.

## Create a founder-owned GitHub repository

From a reviewed, committed checkout, run `sh templates/sunday-stories/scripts/new-founder-repo.sh YOUR-ORG/YOUR-NEW-REPO`. The script copies only the committed kit into a new **private** repository with fresh history and pushes with your authenticated GitHub CLI. It requires Git, tar, a configured commit identity and permission to create a repo in that org. From an already-extracted kit use `sh scripts/new-founder-repo.sh YOUR-ORG/YOUR-NEW-REPO`. An existing name will fail without overwriting that repository.

The MIT license applies to this directory. The script does not copy the rest of Family Intelligence OS or grant rights to other repositories. A founder can enable GitHub’s Template repository setting on their own clean copy for future deployments. Keep family media, real names, tokens and keys outside all Git repos.

## Deployment

| Profile | Settings | Intended use |
| --- | --- | --- |
| Cloudflare | From the kit root run `npm test`, set a unique Worker name in `wrangler.jsonc`, then `npx wrangler deploy` from an authorized account | Primary low-custody family fieldbook. One small Worker serves only the bundled files. No D1, R2 or identity binding. |
| Vercel | Import the founder repo, use the kit root, framework Other, no build/install command, output `public`. In the original monorepo set Root Directory to `templates/sunday-stories` | Equivalent static delivery, useful for design previews. Team deployment protection may require sign-in. |
| Existing private Family OS | Continue to use its separately reviewed Next.js deployment and policy gateway | Reserved for authenticated grants, private records, consent and future adapter activation. This kit does not unlock it. |

Use one stable origin per family. Browser-local settings and unsaved recordings cannot roam between hosts. The public build has no write API. The Worker rejects non-GET/HEAD requests. An operator still controls served code and the hosting provider can process ordinary access metadata.

## Verification and rollback

`npm test` runs contract and Worker byte-equivalence tests using Node 22+. `npm run build` writes a self-contained ES module to the ignored dist directory. The Worker asset pack is optimized for this small bounded release. Use native static asset storage if the library grows.

For interaction tests, make the Playwright package and its Chromium browser available and run `node tests/browser.cjs` after `npm test`. The test starts a local server using the production Worker. `CHROMIUM_BIN` can select an installed Chromium. Synthetic microphone input is used. Browser emulation cannot establish microphone quality, actual home-screen installation or calendar notification delivery on an individual phone.

Rollback by redeploying the previous reviewed asset version on the same hostname. To retire the public pilot, disable its workers.dev endpoint and remove the optional Vercel deployment. Never erase device storage as part of a software rollback. A downloaded or shared file remains under its owner's control.

## Source and design

[Family desk, story card and field school in Figma](https://www.figma.com/design/4SBRYEU7KEVBcCqXnDXPsa). The warm paper, serif headlines and restrained action color were informed by the Alison Roman editorial reference. Capture, playback and export ordering were informed by [Voicenotes](https://refero.design/screens/4d2173ab-41f9-4cf6-9b1a-f8fd0349eaa6) and the [voice-note review flow](https://refero.design/flows/2878). All shipped icons and landscape artwork were drawn for this kit.
