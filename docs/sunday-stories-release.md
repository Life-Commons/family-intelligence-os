# Family Commons release decision

Use Life-Commons/family-intelligence-os for reusable family interfaces, frankxai/family-intelligence-systems for governance, and Life-Commons/family-history-atlas for reviewed historical projections. Keep frankxai/family-intelligence-os PR 5 as the source for the proposed authenticated QR boundary and PR 8 for the separate Kitchen Notes pilot. The repositories share history. This release does not establish an automatic mirror or change repository ownership.

Starlight sells kits, curriculum updates and deployment tooling. Each family owns its deployment, its identity and its originals. An implementor is not an archive reader. Registering a phone must never turn a daughter coordinating care into an administrator of her parents' private conversations.

## Product boundaries

| Surface | Today | Next private pilot and acceptance test |
| --- | --- | --- |
| Caregiver desk | Choose role-specific home screen, register a local setup acknowledgement, create a calendar event, review teacher cards | Show a dedicated family calendar, last refresh and explicit sharing grants. One person can withdraw a grant without affecting another. Display expired or needs-reconnect states. |
| Grandparent | Two-minute, foreground-only voice recording, local playback, text fallback, local voice prompt where available, deliberate export | A family-owned vault inbox accepts a chosen original. Hash, ingest quarantine, purpose and audience receipt precede indexing. A grandparent can revoke sharing and a trustee can restore the original. |
| Child and teacher | Guardian chooses a three-step card or reviews a teacher-authored or adult-AI-assisted draft. Child uses the family UI. No model call, tracking or account required | Teacher may propose a version to an assigned circle. Guardian approves source, age band, duration and actions. Revocation removes future access; copies already exported need separate handling. Parent can complete a real session without technical help. |
| Care tasks | A normal calendar visit or check-in, confirmed by its owner | Track “ride needed” or “please call” when explicitly shared. No dosage suggestions, compliance scores, wearable interpretation, emergency monitoring or inference from missed acknowledgements. |
| Device enrollment | Expiring setup link, recipient selects a local preference, returned-code acknowledgement. No remote install, identifiable device fingerprint or live status | Adult passkey + expiring, single-use invitation + device-bound credential + recipient acceptance. Bind scope on server. Test replay, expiry, revoked device, lost phone, cross-family denial and second-device recovery. Use platform family controls for managed installation where appropriate. |
| Archive and Atlas | Person chooses a file destination. Drive shortcut and system share sheet are manual | Save to a family-controlled location with a restricted selector, verify a restore and enforce audience changes. Atlas consumes approved, source-linked projections. Preserve recollections as attributed claims and keep the original recording separate from AI summaries. |

## Hosting and integrations

For the first family run one static origin. Vercel previews can use exactly the same assets. A dual-cloud private system earns its operating cost only when the authenticated Next.js dashboard needs managed preview deployments plus a family-owned Cloudflare execution/storage boundary. Keep the existing identity/policy repository authoritative. Do not create another grants database in D1 by default. Never attach this public app to an existing family database merely because an account contains one.

| Provider | First connection | Private connector contract |
| --- | --- | --- |
| Google Calendar | Local ICS or prefilled event confirmed in Google Calendar | Use a dedicated app-created calendar where suitable. A broader read of an existing family calendar requires deliberate scope selection and purpose. Show the exact calendar, freshness and failure state. |
| Drive | Choose a folder after local export | Picker and drive.file for individually selected or app-created items. Validate actual permissions and intended audience before each transfer. An app-selected folder's inherited access can expose an original. |
| Notion | Weekly-plan link | Optional read-only connection to selected planning pages. No family archive, child transcripts or health data in a shared planning database. Recheck access at read time and handle page removal. |
| AI | Generic adult drafting brief. Only an adult manually opens a provider; child runtime is deterministic | Optional per-family server-side key or a capped subscription allowance. Isolate tenant credentials; no provider keys in the browser, Git or setup links. Include per-member budgets, processor choice, no silent fallback, deletion and visible usage receipts. |
| Reminders | Family calendar owns delivery | Explicit local time zone, quiet hours, opt-out, deduplication, delivery/failure state. Device check-ins are voluntary, self-reported and never proof of health. |

## Commercial hypothesis

| Offer | What the founder receives | Custody and economics |
| --- | --- | --- |
| Commons · free | MIT kit, private repo bootstrap, four activities, capture/export, calendar handoff, two hosting profiles | Family pays its own host and optional provider. Personal records, export and recovery should never be paywalled. |
| Founder Kit · €49 once, proposed | Editable design files, bilingual launch packs, age-banded teacher cards, tested deployment recipes and a first-week family setup guide | Fixed digital delivery. Validate five paid preorders before expanding content. |
| Family Studio · €12/household/month, proposed | New educator packs, tested updates and adult curation workflows | Monetize continued editorial and maintenance work. Optional BYOK or separately capped credits; never bundle unlimited inference. Private use never requires a vendor copy of the vault. |

These are price experiments. No checkout, payment collection or subscription is enabled. The pilot metric is one caregiver completing a three-device week: one story kept by its owner, one lesson completed together and one calendar invitation confirmed. Collect success by voluntary report; never collect the audio to measure completion.

## Release sequence

1. Public fieldbook: verify the actual target phones, denied mic, interrupted recording, downloaded file recovery, cold home-screen launch and calendar reminders. The public interface can be distributed independently of the private portal.
2. Family-owned connectors: one adult, one provider and one resource. Implement audit, disconnect, two-account isolation and recovery before adding a second relative. Expose fresh sync state before publishing a connected dashboard.
3. Authenticated family vault: identity, short-lived object access, quarantine, consent changes, integrity, restore and independent review. An AI-generated transcription is a derivative requiring its own scope and deletion policy.
4. Roll out one household with separate guardian, educator, storyteller and implementor permissions. Consider a native companion only after measured failures of browser background syncing, accessibility or device management justify its maintenance cost.

Service references: [Google Calendar scopes](https://developers.google.com/workspace/calendar/api/auth), [Google Drive scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [Notion authorization](https://developers.notion.com/guides/authorization/overview), [ChatGPT age guidance](https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages), [web app installation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).
