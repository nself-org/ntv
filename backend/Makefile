# nTV backend — convenience commands
# All operations run through the nSelf CLI.
# Never invoke docker-compose directly.

.PHONY: setup build start stop status logs db-console help

help:
	@printf "nTV backend commands\n"
	@printf "\n"
	@printf "  make setup       Install all required plugins (run once after cloning)\n"
	@printf "  make build       Generate docker-compose from nself.yaml + .env\n"
	@printf "  make start       Start the full backend stack\n"
	@printf "  make stop        Stop the backend stack\n"
	@printf "  make status      Show status of all services\n"
	@printf "  make logs        Tail logs from all services\n"
	@printf "  make db-console  Open interactive database console\n"
	@printf "\n"
	@printf "First-time setup:\n"
	@printf "  1. cp .env.example .env\n"
	@printf "  2. Set NSELF_PLUGIN_LICENSE_KEY in .env (nMedia bundle, nself.org/pricing)\n"
	@printf "  3. Set TMDB_API_KEY in .env (free at themoviedb.org)\n"
	@printf "  4. make setup && make build && make start\n"

setup:
	nself plugin install \
		media-processing \
		streaming \
		stream-gateway \
		epg \
		tmdb \
		torrent-manager \
		content-acquisition \
		subtitle-manager

build:
	nself build

start:
	nself start

stop:
	nself stop

status:
	nself status

logs:
	nself logs

db-console:
	nself db console
