FROM node:20-bookworm

ARG TZ
ENV TZ="$TZ"

ARG CLAUDE_CODE_VERSION=latest
ARG CODEX_VERSION=latest
ARG GIT_DELTA_VERSION=0.18.2
ARG ZSH_IN_DOCKER_VERSION=1.2.0
ARG USERNAME=node

RUN set -eux; \
  if [ -f /etc/apt/sources.list ]; then \
    sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list; \
  fi; \
  if [ -d /etc/apt/sources.list.d ]; then \
    find /etc/apt/sources.list.d -type f \( -name "*.list" -o -name "*.sources" \) \
      -exec sed -i 's|http://deb.debian.org|https://deb.debian.org|g' {} \; ; \
  fi; \
  apt-get update; \
  apt-get install -y --no-install-recommends \
    less git procps sudo fzf zsh man-db unzip gnupg iptables ipset iproute2 dnsutils jq nano vim wget ca-certificates; \
  apt-get clean; \
  rm -rf /var/lib/apt/lists/*

RUN mkdir -p /usr/local/share/npm-global/lib/node_modules /usr/local/share/npm-global/bin && \
  chown -R node:node /usr/local/share/npm-global

RUN mkdir -p /commandhistory && \
  touch /commandhistory/.bash_history && \
  chown -R $USERNAME /commandhistory

ENV DEVCONTAINER=true

RUN mkdir -p /workspace /home/node/.claude /home/node/.codex && \
  chown -R node:node /workspace /home/node/.claude /home/node/.codex

WORKDIR /workspace

RUN set -eux; \
  ARCH="$(dpkg --print-architecture)"; \
  wget -O /tmp/git-delta.deb \
    "https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb"; \
  dpkg -i /tmp/git-delta.deb; \
  rm /tmp/git-delta.deb

USER node

ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin
ENV SHELL=/bin/zsh
ENV EDITOR=nano
ENV VISUAL=nano

RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
  -p git \
  -p fzf \
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \
  -a "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  -x

RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION} \
  && npm install -g @openai/codex@${CODEX_VERSION}

COPY init-firewall.sh /usr/local/bin/

USER root
RUN chmod +x /usr/local/bin/init-firewall.sh && \
  echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall && \
  chmod 0440 /etc/sudoers.d/node-firewall

USER node