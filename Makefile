default:
	@echo no default

story-to-html:
	WSLENV=$$WSLENV:TWEEGO_PATH/l \
	TWEEGO_PATH=./assets \
		tweego story.tw -o index.html

story-to-tw:
	WSLENV=$$WSLENV:TWEEGO_PATH/l \
	TWEEGO_PATH=./assets \
		tweego -d index.html -o story.tw

nero-check:
	clear; node tools/list-vars.js nero.tw nero-vars.txt '^n\d|^t_|^mt_'

nero-stats:
	node tools/nero-stats.js nero.tw

nero-to-html:
	WSLENV=$$WSLENV:TWEEGO_PATH/l \
	TWEEGO_PATH=./assets \
		tweego nero.tw -o nero.html

nero-to-tw:
	WSLENV=$$WSLENV:TWEEGO_PATH/l \
	TWEEGO_PATH=./assets \
		tweego -d nero.html -o nero.tw

nero-version:
	node tools/update-version.js nero.tw nero.html
