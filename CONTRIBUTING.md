# Contributing Guidelines

We welcome contributions! Whether fixing bugs, adding features, or improving
documentation, your help is appreciated. Please follow these guidelines.

## 1. Fork & Clone
- Fork the repo and clone it:
  git clone https://github.com/yourusername/webrtc-ssl-automation.git
- Create a new branch:
  git checkout -b feature/your-feature-name

## 2. Code Style
- Bash: use `bash -n` for syntax check.
- JS/HTML: keep code clean and formatted.
- Keep commits focused and descriptive.

## 3. Security
- Never commit secrets, passwords, or private keys.
- Ensure exposed scripts have IP restrictions or authentication.
- Client demo (HTML/JS) is for testing only.

## 4. Testing
- Test scripts locally before PR.
- Verify WebRTC connections over HTTPS/WSS.
- Confirm SSL generation and renewal works.

## 5. Documentation
- Update `USAGE.md`, `SECURITY.md`, or inline comments.
- Keep instructions clear and step-by-step.

## 6. Pull Requests
- Push your branch to your fork.
- Open a PR against `main`.
- Provide a clear description and relevant logs/screenshots.
- Respond to review comments and update PR if needed.

## 7. Reporting Issues
- Use GitHub Issues for bugs or features.
- Include steps to reproduce, logs, and environment details.

## 8. Code of Conduct
- Be respectful and constructive.
- Avoid malicious code.
- Focus on collaboration and learning.
