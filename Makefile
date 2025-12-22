dev:
	@echo "Starting Docker..."
	docker-compose up --build


update:
	@echo "Rebuilding and renewing volumes..."
	docker-compose down
	docker-compose up --build -V


setup:
	@echo "Installing dependencies locally..."
	cd backend && npm install
	cd frontend && npm install

stop:
	docker-compose down

clean:
	docker-compose down -v --rmi local