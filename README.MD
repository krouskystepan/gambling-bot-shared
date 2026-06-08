# Gambling System – Shared Package

This repository is **one part of a larger multi-repository system**.

👉 **Full case study & system documentation:**  
https://www.krouskystepan.com/projects/discord-gambling-hub

## Repositories

The project is split into three repositories:

- **Admin Panel**
  - Web interface for managing data and configuration.
  - 🔗 https://github.com/krouskystepan/gambling-bot-admin

- **Discord Bot**
  - Uses the shared data and logic to run the gambling system inside Discord.
  - 🔗 https://github.com/krouskystepan/gambling-bot-discord

- **Shared Package (this repository)**
  - Common types, database models, and business logic shared between the admin panel and the bot.
  - 🔗 https://github.com/krouskystepan/gambling-bot-shared

## Community

This project has a public Discord server where users can explore the system,
try the bot features, and follow development updates.

👉 **Discord server:**  
https://discord.gg/Y2mMQN5QVE

All architecture decisions, data flow, and detailed explanations are documented
in the case study linked above.

## Local development

See [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md) for the local linking workflow, debugging commands, and release process.

## GitHub / CI

See [docs/GITHUB_SETUP.md](./docs/GITHUB_SETUP.md) for CI workflows and branch protection on `main`.
