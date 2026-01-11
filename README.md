# scouter-backend

Backend server for Scouter (scouting app) that runs on port 8000.

## Scripts

```
pnpm run setup
```
```
node setup.js
```
Sets up the environment by installing PNPM if necessary, installing all packages, creating a .env file, and updating the database. This should be run after cloning the repository.

```
pnpm setup:prod
```
```
node setup.js --prod
```
Does the same as `pnpm run setup` and `node setup.js`, but additionally builds the project for production.

```
pnpm dev
```
Runs the server in development mode with logging and automatic reloading.

```
pnpm build
```
Builds the project for production.

```
pnpm start
```
Runs the server in production mode. This will fail if the server has not been setup in production mode with either `pnpm setup:prod` or `node setup.js --prod`.

```
pnpm reset-db
```
Resets the database's data and seeds it with the test user.

```
pnpm check
```
Runs the linter and code formatter on the project without changing any files.

```
pnpm fix
```
Runs the linter and code formatter on the project, fixing any files that can be fixed automatically.

```
pnpm test
```
Runs all tests. `pnpm reset-db` should be run before and after tests to clean up leftover data.

```
pnpm test:watch
```
Runs all tests with automatic reloading.

## Routes

Any route with a request body schema will return a 400 status code if the request body is invalid. Routes that are not for authentication require the Authorization header to be set with a valid bearer token and return a 401 status code if this requirement is not met. All 4XX status codes have the following response body where `code` is a SCREAMING_SNAKE_CASE error code:
```ts
{ code: string }
```

### GET /me

Returns basic information about the user. If the account has been deleted, a 410 status code is returned with `code` set to `DELETED_ACCOUNT`. Upon success, a 200 status code is returned with the following response body:
```ts
{
  username: string,
  firstName: string,
  lastName: string,
}
```

### PATCH /me

Updates the user's profile and settings. If the account has been deleted, a 410 status code is returned with `code` set to `DELETED_ACCOUNT`. Upon success, a 204 status code is returned. The following request body schema is used:
```ts
{
  username?: string, // 1-30 characters
  password?: string, // 1-50 characters
  firstName?: string, // 1-50 characters
  lastName?: string, // <=50 characters
}
```

### DELETE /me

Deletes the user's account. A 204 status code is always returned.

### GET /users

Returns a list of users. A 200 status code is always returned with the following response body:
```ts
{
  id: number, // unsigned integer
  firstName: string,
  lastName: string,
}[]
```

### GET /report/:id

Returns a scouting report. `id` should be an integer. If the report does not exist, a 404 status code is returned with `code` set to `REPORT_NOT_FOUND`. Upon success, a 200 status code is returned with the following response body:
```ts
{
  user: {
    id: number, // unsigned integer
    firstName: string,
    lastName: string,
  } | null,
  createdAt: string, // ISO 8601 date-time
  eventCode: string,
  matchType: "PRACTICE" | "QUALIFICATION" | "PLAYOFF",
  matchNumber: number, // integer
  teamNumber: number, // integer 1-20000
  notes: string,
  trenchOrBump: "TRENCH" | "BUMP",
  minorFouls: number, // integer
  majorFouls: number, // integer
  auto: {
    notes: string,
    movement: boolean,
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level1: boolean,
  },
  teleop: {
    notes: string,
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: number, // unsigned integer
  },
  endgame: {
    notes: string,
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: number, // unsigned integer
  },
}
```

### POST /report

Creates a scouting report. A 201 status code is always returned. The following request body schema is used:
```ts
{
  createdAt: string, // ISO 8601 date-time
  eventCode: string, // 5 characters
  matchType: "PRACTICE" | "QUALIFICATION" | "PLAYOFF",
  matchNumber: number, // integer 1-200
  teamNumber: number, // integer 1-20000
  notes: string, // <=400 characters
  trenchOrBump: "TRENCH" | "BUMP",
  minorFouls: number, // unsigned integer
  majorFouls: number, // unsigned integer
  auto: {
    notes: string, // <=400 characters
    movement: boolean,
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level1: boolean,
  },
  teleop: {
    notes: string, // <=400 characters
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: number, // unsigned integer
  },
  endgame: {
    notes: string, // <=400 characters
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: number, // unsigned integer
  },
}
```

### GET /reports

Returns a list of reports. Query parameters can be used to filter the results. The following schema is used for query parameters:
```ts
{
  userId?: number, // unsigned integer
  eventCode?: string, // 5 characters
  matchType?: "PRACTICE" | "QUALIFICATION" | "PLAYOFF",
  teamNumber?: number, // 1-20000
  trenchOrBump?: "TRENCH" | "BUMP",
  noMinorFouls?: boolean,
  noMajorFouls?: boolean,
  autoMovement? boolean,
  take: number, // unsigned integer - return N reports
  skip: number, // unsigned integer - skip first N reports
}
```
A 200 status code is always returned with the following response body:
```ts
{
  id: number, // unsigned integer
  teamNumber: number, // integer 1-20000
  user: {
    id: number, // unsigned integer
    firstName: string,
    lastName: string,
  } | null,
}[]
```

### Authentication

All authentication routes start with **/auth** and upon success, return a 201 status code with the following response body, except for **/auth/logout**:
```ts
{
  accessToken: string, // JWT
  refreshToken: string, // UUID
}
```

#### POST /auth/sign-up

Creates an account. If the team password is not "AlexaIsOurScoutingLead!", a 401 status code is returned with `code` set to `INCORRECT_TEAM_PASSWORD`. If the username is taken, a 409 status code is returned with `code` set to `USERNAME_TAKEN`. The following request body schema is used:
```ts
{
  username: string, // 1-30 characters
  password: string, // 1-50 characters
  firstName: string, // 1-50 characters
  lastName: string, // <=50 characters
  teamPassword: string, // >=1 character
}
```

#### POST /auth/login

Logs the user in. If the user does not exist, a 401 status code is returned with `code` set to `NO_SUCH_USER`. If the password is incorrect, a 401 status code is returned with `code` set to `INCORRECT_PASSWORD`. The following request body schema is used:
```ts
{
  username: string, // 1-30 characters
  password: string, // 1-50 characters
}
```

#### POST /auth/logout

Logs the user out by deleting the refresh token. The request body should be the refresh token. A 204 status code is always returned.

#### POST /auth/refresh

Creates a new access token and rotates the refresh token. This should be called when the access token expires. The request body should be the refresh token. If the refresh token is invalid, a 401 status code with `code` set to `INVALID_REFRESH_TOKEN`. If the refresh token has already expired, a 401 status code is returned with `code` set to `EXPIRED_REFRESH_TOKEN`.

## Test User

There is a test user with a username of "testuser" and password of "4FeetTallRisith?45!" that is useful for development.
