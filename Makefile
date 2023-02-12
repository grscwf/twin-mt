default:
	@echo no default

nero-check:
	clear; node tools/list-vars.js nero.tw nero-vars.txt '^n\d|^t_|^mt_'

nero-stats:
	node tools/nero-stats.js nero.tw

nero-version:
	node tools/update-version.js nero.tw nero.html
