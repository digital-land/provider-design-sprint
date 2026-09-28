.PHONY: upgrade

upgrade:
	npm update --package-lock-only
	-npm audit fix --package-lock-only
