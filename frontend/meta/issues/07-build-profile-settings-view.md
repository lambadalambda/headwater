# 07 Build profile settings view

## Summary

Implement the profile settings page with editable profile fields, upload controls, toggles, dirty state, and preview rail.

## Requirements

- Add settings breadcrumbs, title, and explanatory copy.
- Add avatar and banner upload rows with preview treatment.
- Add editable display name, username, instance/domain display, bio, website, and location fields.
- Add toggles for discoverable, indexable, and follower count visibility.
- Track dirty state and show saved versus unsaved state.
- Add Save and Reset actions.
- Add profile preview and profile tips cards in the right rail or mobile sheet.

## Acceptance Criteria

- Playwright tests cover editing fields, toggling settings, dirty-state messaging, Save, and Reset.
- Mobile layout stacks form fields and keeps controls touch-friendly.
- Upload controls are visually present, with file handling stubbed or mocked until API integration.

## Notes

- Save behavior can be mocked first. Real profile update endpoints belong in the API wiring issue.
