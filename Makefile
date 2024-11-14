.DEFAULT_GOAL := help

.ONESHELL:

.SHELLFLAGS = -ec

.PHONY: help
help: ## Show this help.
	@printf "\e[1m%-30s\e[0m | \e[1m%s\e[0m\n" "Target" "Description"
	printf "\e[2m%-30s + %-41s\e[0m\n" "------------------------------" "------------------------------------------------"
	egrep '^[^:]+\: [^#]*##' $$(echo $(MAKEFILE_LIST) | tac --separator=' ') | sed -e 's/:[^#]*/ /' | sort -V | awk -F '[: ]*' \
	'{
		if ($$2 == "##")
		{
			$$1=sprintf(" %-28s", $$1);
			$$2=" | ";
			print $$0;
		}
		else
		{
			$$1=sprintf("  └ %-25s", $$1);
			$$2=" | ";
			$$3=sprintf(" └ %s", $$3);
			print $$0;
		}
	}'

.PHONY: setup
setup: setup-lint  ## Set up a development environment

.PHONY: setup-lint
setup-lint: ##- Set up linters
ifneq ($(shell which npx),)
else ifneq ($(shell which snap),)
	sudo snap install --classic --channel 22 node
else
	$(error Cannot find npx. Please install it on your system.)
endif

.PHONY: format
format: format-prettier ## Automatically format source files

.PHONY: format-prettier
format-prettier: setup-lint ##- Automatically format files with prettier
	npx prettier --print-width=99 --config=.prettierrc.json --write .

.PHONY: lint
lint: lint-prettier ## Run all linters

.PHONY: lint-prettier
lint-prettier: setup-lint  ##- Lint with prettier
	npx prettier --print-width=99 --config=.prettierrc.json --check .
