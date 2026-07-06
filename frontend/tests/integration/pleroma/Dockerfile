FROM ubuntu:24.04

ARG PLEROMA_RELEASE_FLAVOUR=amd64
ARG PLEROMA_RELEASE_REF=stable

ENV DEBIAN_FRONTEND=noninteractive
ENV ELIXIR_ERL_OPTIONS="+fnu" \
	LANG=C.UTF-8 \
	LC_ALL=C.UTF-8

RUN apt-get update \
	&& apt-get install -y --no-install-recommends bash ca-certificates curl libncurses6 libvips42t64 passwd postgresql-client unzip \
	&& rm -rf /var/lib/apt/lists/*

RUN groupadd --system pleroma \
	&& useradd --system --gid pleroma --home-dir /opt/pleroma --create-home --shell /usr/sbin/nologin pleroma \
	&& mkdir -p /etc/pleroma /var/lib/pleroma/static /var/lib/pleroma/uploads \
	&& chown -R pleroma:pleroma /etc/pleroma /opt/pleroma /var/lib/pleroma

USER pleroma
WORKDIR /opt/pleroma

RUN curl -fsSL "https://git.pleroma.social/api/v4/projects/2/jobs/artifacts/${PLEROMA_RELEASE_REF}/download?job=${PLEROMA_RELEASE_FLAVOUR}" -o /tmp/pleroma.zip \
	&& unzip -q /tmp/pleroma.zip -d /tmp \
	&& mv /tmp/release/* /opt/pleroma/ \
	&& rm -rf /tmp/pleroma.zip /tmp/release

COPY --chown=pleroma:pleroma config.exs /etc/pleroma/config.exs
COPY --chown=pleroma:pleroma docker-entrypoint.sh /opt/pleroma/docker-entrypoint.sh

RUN chmod 640 /etc/pleroma/config.exs \
	&& chmod +x /opt/pleroma/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["/opt/pleroma/docker-entrypoint.sh"]
