# Makefile — nself/ntv (Flutter)
# Thin task runner. nSelf-First: backend ops use `nself` CLI.

.PHONY: ci-local test analyze format-check

ci-local: ## Run the same gate suite CI runs remotely (format + analyze + test)
	@echo "==> [ci-local] dart format check"
	dart format --set-exit-if-changed lib/ test/
	@echo "==> [ci-local] flutter analyze"
	flutter analyze --no-pub
	@echo "==> [ci-local] flutter test"
	flutter test
	@echo "==> [ci-local] DONE"

test: ## Run Flutter unit tests
	flutter test

analyze: ## Run flutter analyze
	flutter analyze --no-pub

format-check: ## Check Dart formatting (no changes written)
	dart format --set-exit-if-changed lib/ test/

.PHONY: help
help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
