FROM mcr.microsoft.com/devcontainers/base:bookworm

# Update package lists, upgrade installed packages, install build-essential,
# and then clean up apt cache to reduce image size.
# Using --no-install-recommends helps to keep the image slim.
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*


# Switch to the non-root user 'vscode'
USER vscode

# Install uv (a fast Python package installer and resolver)
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv's shell completion to the bash profile for the vscode user
RUN echo 'eval "$(uv generate-shell-completion bash)"' >> ~/.bashrc


# Make nvm version an argument to easily update it
ARG NVM_VERSION=0.39.7

# Set the NVM_DIR environment variable.
ENV NVM_DIR="/home/vscode/.nvm"

# Add the final node path to the PATH environment variable for future sessions.
ENV PATH="${NVM_DIR}/versions/node/current/bin:${PATH}"

# Install nvm, Node.js, and global npm packages in a single RUN layer.
# This ensures that `npm` is available on the path immediately after installation.
RUN curl -o- "https://raw.githubusercontent.com/nvm-sh/nvm/v${NVM_VERSION}/install.sh" | bash \
    && . "$NVM_DIR/nvm.sh" \
    && nvm install --lts \
    && nvm alias default node \
    && npm install -g \
        @anthropic-ai/claude-code \
        @musistudio/claude-code-router