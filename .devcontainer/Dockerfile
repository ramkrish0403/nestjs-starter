FROM mcr.microsoft.com/devcontainers/base:bookworm

# Update package lists, upgrade installed packages, install build-essential,
# and then clean up apt cache to reduce image size.
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Switch to the non-root user 'vscode'
USER vscode

# Arguments for NVM and the specific Node version you want
ARG NVM_VERSION=0.39.7
ARG NODE_VERSION=24.11.1

# Set the NVM_DIR environment variable.
ENV NVM_DIR="/home/vscode/.nvm"

# Add the specific Node version path to the PATH environment variable.
# We use v${NODE_VERSION} here so the binary is available even if nvm isn't sourced in non-interactive shells.
ENV PATH="${NVM_DIR}/versions/node/v${NODE_VERSION}/bin:${PATH}"

# Install nvm, specific Node.js version, and global npm packages.
RUN curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install "${NODE_VERSION}" \
    && nvm alias default "${NODE_VERSION}" \
    && nvm use default \
    && npm install -g \
        @anthropic-ai/claude-code \
        @musistudio/claude-code-router