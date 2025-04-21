# Band Sheets Backend

Backend API for the Band Sheets application. This server provides authentication and data persistence for band sheets.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

3. Make sure MongoDB is installed and running:
   - For macOS: `brew services start mongodb-community`
   - For other platforms, see the [MongoDB documentation](https://docs.mongodb.com/manual/administration/install-community/)

4. Run the MongoDB connection test:
   ```
   node scripts/check-mongo.js
   ```
   This will verify your MongoDB connection and create a test user.

## Running the Server

Start the development server:
```
npm run dev
```

The server will run on port 5000 by default (or the port specified in your `.env` file).

## Testing the API

You can test the authentication API endpoints using the provided script:
```
node scripts/test-auth-api.js
```

This will attempt to:
1. Register a test user
2. Login with the test user
3. Get the user profile
4. Logout
5. Verify logout worked by trying to access a protected route
6. Login again

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
  - Body: `{ username, email, password }`

- `POST /api/auth/login` - Login a user
  - Body: `{ email, password }`

- `GET /api/auth/logout` - Logout the current user

- `GET /api/auth/me` - Get the current logged-in user (protected)

### Sheets

- `GET /api/sheets` - Get all sheets for the current user (protected)

- `POST /api/sheets` - Create a new sheet (protected)
  - Body: Sheet object

- `GET /api/sheets/:id` - Get a specific sheet (protected)

- `PUT /api/sheets/:id` - Update a sheet (protected)
  - Body: Updated sheet object

- `DELETE /api/sheets/:id` - Delete a sheet (protected)

- `POST /api/sheets/:id/share` - Share a sheet with another user (protected)
  - Body: `{ username, permission }`

## Troubleshooting

### MongoDB Connection Issues

- Verify MongoDB is running: `ps aux | grep mongo`
- Check MongoDB logs: `cat /usr/local/var/log/mongodb/mongo.log`
- Try connecting manually: `mongo mongodb://localhost:27017/bandsheets`

### Authentication Issues

- Check that your JWT_SECRET in .env is set correctly
- Verify that cookies are being properly set (check browser dev tools)
- Ensure CORS is properly configured for your frontend origin

### API Request Issues

- Check the server logs for detailed error messages
- Use the browser's network tab to inspect request/response details
- Verify that the API URL in the frontend matches the backend URL
