# Band Sheets Application

A full-stack application for creating and managing band sheets.

## Docker Setup

This project uses Docker to create a consistent development environment and avoid browser security issues.

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

### Getting Started

1. Clone the repository
2. Navigate to the project root directory
3. Run the following command to start all services:

```bash
docker-compose up
```

This will start:
- MongoDB database on port 27017
- Backend API server on port 5000
- Frontend React application on port 3000

4. Access the application at [http://localhost:3000](http://localhost:3000)

### Services

#### MongoDB

- Port: 27017
- Data is persisted in a Docker volume

#### Backend API

- Port: 5050
- API endpoint: [http://localhost:5050/api](http://localhost:5050/api)
- Test endpoint: [http://localhost:5050/api/test](http://localhost:5050/api/test)

#### Frontend

- Port: 3000
- URL: [http://localhost:3000](http://localhost:3000)

### Development Workflow

The Docker setup uses volume mounts, so any changes you make to the source code will be reflected in the running containers. For most changes, you don't need to rebuild the containers.

If you make changes to package.json or Dockerfile, you'll need to rebuild the containers:

```bash
docker-compose up --build
```

### Stopping the Services

To stop all services:

```bash
docker-compose down
```

To stop all services and remove volumes (this will delete all data in MongoDB):

```bash
docker-compose down -v
```

## Architecture

The application consists of:

1. **Frontend**: React application with services for:
   - PDF generation and export
   - Sheet storage with localStorage
   - Chord transposition utilities
   - UI styling utilities
   - State management via React Context

2. **Backend**: Node.js/Express API with:
   - Authentication system
   - MongoDB database
   - In-memory fallback for data storage

## Authentication

The application uses JWT-based authentication with tokens stored in cookies for secure cross-origin requests.

## Components

The frontend has been refactored to improve maintainability with these components:
- Toolbar - The vertical navigation buttons on the left
- Sidebar - The panel showing saved sheets
- SongInfoBar - The form for editing song title, artist, and BPM
- SheetHeader - The column headers for the band sheet

## State Management

The application uses React Context for state management, with:
- EditingContext - Centralizes all editing operations
- AuthContext - Manages authentication state

## Troubleshooting

If you encounter issues:

1. **Check Docker logs**:
   ```bash
   docker-compose logs
   ```

2. **Check specific service logs**:
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   docker-compose logs mongodb
   ```

3. **Rebuild containers**:
   ```bash
   docker-compose up --build
   ```

4. **Reset everything**:
   ```bash
   docker-compose down -v
   docker-compose up --build
   ```
