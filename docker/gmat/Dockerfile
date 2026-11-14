# Thin app layer: the GMAT bridge on top of the prebuilt base image (builds in seconds).
# scripts/gmat-up.mjs pulls or builds the base for you; `npm run dev` runs it.
ARG BASE=smdg-gmat-base:r2025a
FROM ${BASE}
WORKDIR /app
COPY scripts/gmat-bridge.mjs scripts/gmat-server.mjs scripts/
COPY public/game/02-orbit.js public/game/02-orbit.js
ENV GMAT_CONSOLE=/opt/gmat/R2025a/bin/GmatConsole PORT=8787
EXPOSE 8787
USER 1000
CMD ["node", "scripts/gmat-server.mjs"]
