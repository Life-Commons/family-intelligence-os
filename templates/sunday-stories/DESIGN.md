# Sunday Stories interface

The home screen offers a story, a discovery and a visit. A caregiver opens Family setup when preparing a phone. Each activity opens directly on the receiving device. The existing browser preferences and exported files remain compatible.

## Reference lock

| Decision | Reference | Applied role |
| --- | --- | --- |
| Spacious sans-serif type, rounded surfaces, primary blue actions | [Headspace](https://refero.design/styles/c73224da-e583-4833-bf39-3f414c317474) | Dominant visual foundation. Blue indicates action. Peach and lavender distinguish story and discovery content. System fonts avoid another network dependency. |
| Quiet supporting controls | [ChatGPT](https://refero.design/styles/667cf5b9-5940-4db5-a972-fb6bd51d5783) | Secondary labels and tools recede behind the current task. |
| Choose an activity, then share its link through the phone | [Napper caregiver invitation](https://refero.design/flows/8784) | Two setup stages and the native share sheet. A copied link remains available. The recipient chooses whether to keep the activity. |
| One player, one primary save action, more options below | [Andante audio review](https://refero.design/screens/13368282-8caa-4f3b-b083-b5de51e20a64) | Recorder and review states. Playback remains a native accessible audio control. No fabricated waveform or automatic playback. |
| Three steps with visible progress and a return control | Family activity requirements | Each step is readable on its own. Previous and next controls preserve the place in the activity. |

The landscape and book mark are original assets carried forward from the kit. The mark uses the action blue. Artwork remains decorative, with no family images or records.

## Interaction decisions

Home has no setup form. Calendar planning uses a modal dialog with an accessible name, focus containment, Escape and return focus. Calendar import closes only after successful parsing. Errors stay beside the file input.

Family setup shows activity selection first, then sharing. The prepared-phone notebook is collapsed, as are the teacher tools and external-app links. Returned codes remain acknowledgements stored on the caregiver's browser.

Recording shows one microphone action. During capture, Stop replaces it. After capture, playback and Save audio become visible. File sharing appears only when supported. Source notes sit under More options. Writing remains an alternative.

A direct activity link hides the adult navigation. Each person can still use the normal home link. This is navigation behavior, with no claim of guardian authentication or device management.

## Release verification

The existing contract suite and browser family flow cover exports, calendar import, card transfer and saved preferences. Added UI checks cover hidden setup fields on Home, alternate questions, native share handoff, clipboard fallback, modal Escape, lesson progress/back navigation and responsive widths 320–1280. Review the home, recording, audio-review and invitation screenshots after material visual changes.
