# 05 Build thread detail view

## Summary

Implement the post detail view with ancestors, focused post, inline reply composer, and nested replies.

## Requirements

- Open a thread from a timeline post.
- Show ancestors above the focused post with thread connector lines.
- Show the focused post with larger body text, source/date metadata, engagement counts, and full action row.
- Add inline reply composer with reply-specific controls and character count.
- Show replies with expandable nested replies.
- Include back navigation to the previous timeline context.

## Acceptance Criteria

- A Playwright test opens a thread from the home timeline and returns to the previous view.
- Ancestors, focused post metadata, reply composer, and reply count are visible with mocked data.
- Expandable nested replies can be opened in the UI.
- Thread layout remains readable and free of horizontal overflow on mobile.

## Notes

- Pleroma conversation/context API details should be isolated behind the API client once wired.
