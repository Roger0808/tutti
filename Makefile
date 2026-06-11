.PHONY: dev-cli dev-gui dev-web

dev-cli:
	@pnpm dev:cli

dev-gui:
	@bash ./tools/scripts/dev-gui.sh

dev-web:
	@pnpm dev:web
