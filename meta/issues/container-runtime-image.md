# Add Docker and Podman runtime support

## Summary

Resolve GitHub issue #2 with a production container, persistent runtime setup,
and automatically published GHCR images.

## Requirements

- Build the compiled daemon and static frontend in a reproducible multi-stage
  container build.
- Run as a non-root user and persist identity, credentials, auth, and daemon
  state outside the image.
- Provide a Compose setup usable by Docker Compose and Podman Compose.
- Bind the published host port to loopback by default.
- Smoke-test the image and publish multi-architecture images from GitHub Actions.
- Document build, pull, start, stop, logs, storage, upgrades, and base-URL
  configuration in the README.

## Acceptance Criteria

- Docker or Podman can build the image from the repository root.
- A container reaches `/api/headwater/status` with a persistent named volume.
- `compose.yaml` works with both `docker compose` and `podman compose`.
- GitHub Actions tests the container before publishing `latest`, commit SHA,
  and release-tag image references to GHCR.
- The README documents both local builds and the published image.

## Notes

- GitHub issue: https://github.com/lambadalambda/headwater/issues/2
