# scouter-backend

Backend server for Scouter (scouting app) that runs on port 8000.

## Scripts

```
pnpm run setup
```
```
node setup.js
```
Sets up the environment by installing PNPM if necessary, installing all packages, creating a .env file, and creating/updating the database. This should be run after cloning the repository, and PostgreSQL should already be installed.

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
pnpm check:fix
```
Runs the linter and code formatter on the project, fixing any files that can be fixed automatically.

```
pnpm test
```
Runs all tests. `pnpm reset-db` should be run before and after tests to clean up leftover data.

```
pnpm test:watch
```
Does the same as `pnpm test` but with automatic reloading.

## Routes

Note that any route could return a 5XX status code. All 4XX status codes have the following response body where `code` is a SCREAMING_SNAKE_CASE error code:
```ts
type Schema = {
  code: string;
};
```
See https://fastify.dev/docs/latest/Reference/Errors/#fst_err_validation for generic error codes. Routes that are not for authentication require the Authorization header to be set with a valid bearer token. See https://github.com/fastify/fastify-jwt?tab=readme-ov-file#error-code for possible error codes.

### GET /img/:id

Returns the image with `id`. `id` must be a version 4 UUID. The following schema is used for query parameters:
```ts
type Schema = {
  width?: number; // nonnegative integer
  height?: number; // nonnegative integer
};
```
If one dimension is specified but not the other, the other dimension will be scaled automatically. If the image does not exist, a 404 status code is returned with `code` set to `IMAGE_NOT_FOUND`. Upon success, a 200 status code is returned with a WebP image. See https://reactnative.dev/docs/image#gif-and-webp-support-on-android for supporting WebP with React Native on android.

### GET /me

Returns basic information about the user. If the account has been deleted, a 410 status code is returned with `code` set to `DELETED_ACCOUNT`. Upon success, a 200 status code is returned with the following response body:
```ts
type Schema = {
  username: string; // 1-30 characters
  firstName: string; // 1-50 characters
  lastName: string; // 1-50 characters
  avatarId: string | null; // UUID v4
};
```

### PATCH /me

Updates the user's profile and settings. If the content type is not multipart/form-data, a 406 status code is returned with `code` set to `FST_INVALID_MULTIPART_CONTENT_TYPE`. If the form data is invalid, a 422 status code is returned with `code` set to `INVALID_FORM_DATA`. If the account has been deleted, a 410 status code is returned with `code` set to `DELETED_ACCOUNT`. Upon success, a 204 status code is returned. The following schema is used for form data:
```ts
type Schema = {
  username?: string; // 1-30 characters
  password?: string; // 1-50 characters
  firstName?: string; // 1-50 characters
  lastName?: string; // <=50 characters
  avatar?: File | ""; // image, "" to have no avatar
};
```

### DELETE /me

Deletes the user's account. A 204 status code is always returned.

### GET /users

Returns a list of users. A 200 status code is always returned with the following response body:
```ts
type Schema = {
  id: number; // positive integer
  firstName: string; // 1-30 characters
  lastName: string; // 1-30 characters
  avatarId: string | null; // UUID v4
}[];
```

### GET /team/:number

Returns statistics about a team. `number` must be an integer between 1 and 20000. `eventCode` is a required query parameter to specify the event. A 200 status code is always returned with the following response body:
```ts
type Schema = {
  hub: {
    scores: {
      avg: number | null; // nonnegative
      stdev: number | null; // nonnegative
    };
    avgAccuracy: number | null; // nonnegative
  };
  passes: {
    avg: number | null; // nonnegative
    stdev: number | null; // nonnegative
  };
  auto: {
    avgHubscores: number | null; // nonnegative
    avgLevel: number | null; // nonnegative <=1
    avgPasses: number | null; // nonnegative
  };
  teleop: {
    hubScores: {
      avg: number | null; // nonnegative
      stdev: number | null; // nonnegative
      avgWhenDefended: number | null; // nonnegative
    };
    passes: {
      avg: number | null; // nonnegative
      stdev: number | null; // nonnegative
    };
    avgDefended: number | null; // nonnegative <=1 - display as a percentage
  };
  avgEndgameLevel: number | null; // nonnegative <=3
  avgMinorFouls: number | null; // nonnegative
  avgMajorFouls: number | null; // nonnegative
  matchesIn: number | null; // nonnegative
  matchesMissed: number | null; // nonnegative
  matchesIncapacitated: number | null; // nonnegative
  entireMatchesIncapacitated: number | null; // nonnegative
  drivetrain: Drivetrain | null;
  shooter: Shooter | null;
  indexer: Indexer | null;
  climbLevel: number | null; // nonnegative <=3
  driverEvents: number | null; // nonnegative
  weightLbs: number | null; // nonnegative
  epa: {
    total: number;
    auto: number;
    autoHub: number;
    autoTower: number;
    teleop: number;
    teleopHub: number;
    endgameTower: number;
  } | null;
};
```

### Reports

#### Schemas

```ts
type ReportData = {
  createdAt: string; // ISO 8601 date-time
  eventCode: string; // 5 characters
  matchType: "qualification" | "playoff";
  matchNumber: number; // integer 1-200
  alliance: "red" | "blue";
  teamNumber: number; // integer 1-20000
  inMatch: boolean;
  notes: string; // <=400 characters
  minorFouls: number; // nonnegative integer
  majorFouls: number; // nonnegative integer
  secondsIncapacitated: number; // nonnegative integer
  shootingConfidence: number, // nonnegative integer <=5
  auto: {
    hubScores: number; // nonnegative integer
    hubMisses: number; // nonnegative integer
    climb: "none" | "level1" | "failed";
    passes: number; // nonnegative integer
    notes: string; // <=400 characters
  };
  teleop: {
    hubScores: number; // nonnegative integer
    hubMisses: number; // nonnegative integer
    level: number; // nonnegative integer <=3 - zero means the robot did not climb
    climbFailed: boolean;
    passes: number; // nonnegative integer
    defended: boolean;
    wasDefended: boolean;
    notes: string; // <=400 characters
  };
  endgame: {
    level: number; // nonnegative integer <=3 - zero means the robot did not climb
    climbFailed: boolean;
    notes: string; // <=400 characters
  };
};
```

#### GET /report/:id

Returns a scouting report. `id` must be a positive integer. If the report does not exist, a 404 status code is returned with `code` set to `REPORT_NOT_FOUND`. Upon success, a 200 status code is returned with the following response body:
```ts
type Schema = ReportData & {
  user: {
    id: number; // positive integer
    firstName: string; // 1-30 characters
    lastName: string; // 1-30 characters
    avatarId: string | null; // UUID v4
  } | null;
};
```

#### POST /report

Creates a scouting report. A 201 status code is always returned. `ReportData` is used for the request body schema.

#### POST /get-reports

Returns a list of scouting reports and can be filtered. The following schema is used for the request body:
```ts
type Schema = {
  userIds?: number[]; // nonnegative integers
  eventCodes?: string[]; // 5 character strings
  matchType?: "qualification" | "playoff";
  matchNumbers?: number[]; // integers 1-200
  alliance?: "red" | "blue";
  teamNumbers?: number[]; // integers 1-20000
  inMatch?: boolean;
  minorFouls?: {
    min?: number; // integer >=1
    max?: number; // nonnegative integer
  };
  majorFouls?: {
    min?: number; // integer >=1
    max?: number; // nonnegative integer
  };
  secondsIncapacitated?: {
    min?: number; // integer >=1
    max?: number; // nonnegative integer
  };
  shootingConfidence?: {
    min?: number;
    max?: number;
  };
  auto?: {
    hubScores?: {
      min?: number; // integer >=1
      max?: number; // nonnegative integer
    };
    hubMisses?: {
      min?: number; // integer >=1
      max?: number; // nonnegative integer
    };
    level1?: boolean;
    passes?: {
      min?: number; // integer >=1
      max?: number; // nonnegative integer
    };
  };
  teleop?: {
    hubScores?: {
      min?: number; // integer >=1
      max?: number; // nonnegative integer
    };
    hubMisses?: {
      min?: number; // integer >=1
      max?: number; // nonnegative integer
    };
    passes?: {
      min?: number; // integer >=1
      max?: number; // nonnegative integer
    };
    defended?: boolean;
    wasDefended?: boolean;
  };
  endgame?: {
    level?: {
      min?: number; // integer 1-3
      max?: number; // nonnegative integer <=3
    };
    climbFailed?: boolean;
  };
  take?: number; // positive integer - take N reports
  skip?: number; // nonnegative integer - skip the first N reports
};
```
A 200 status code is always returned with the following response body:
```ts
type Schema = {
  id: number; // positive integer
  eventCode: string; // 5 characters
  matchType: "qualification" | "playoff",
  matchNumber: number; // nonnegative integer 1-200
  teamNumber: number; // integer 1-20000
  user: user: {
    id: number; // positive integer
    firstName: string; // 1-30 characters
    lastName: string; // 1-30 characters
    avatarId: string | null; // UUID v4
  } | null;
}[];
```

#### GET /reports/data

Returns the data for every report so it can be downloaded before an event and used if offline. A 200 status code is always returned with `ReportData[]` for the schema.

#### POST /reports/data

Uploads reports in bulk. This route is intended for use with the device used to collect QR codes. The following schema is used for the request body:
```ts
type Schema = (ReportData & {
  userId: number; // positive integer
})[];
```

### Pit Reports

#### Schemas

```ts
enum Drivetrain {
  Swerve = "swerve",
  Tank = "tank",
  Mecanum = "mecanum",
}

enum Shooter {
  Single = "single",
  Dual = "dual",
  Triple = "triple",
  Quad = "quad",
  Turret = "turret",
  DualTurret = "dual_turret",
  Drum = "drum",
  Other = "other",
}

enum Indexer {
  Vertical = "vertical",
  Spindexer = "spindexer",
  Roller = "roller",
  Belt = "belt",
  Gravity = "gravity",
}

export enum AutoAction {
  CollectDepot = "collect_depot",
  CollectOutpost = "collect_outpost",
  CrossLeftBump = "cross_left_bump",
  CrossLeftTrench = "cross_left_trench",
  CrossRightBump = "cross_right_bump",
  CrossRightTrench = "cross_right_trench",
  Shoot = "shoot",
  Climb = "climb",
}

type AutoRoutine = {
  startingPosition: StartingPosition;
  actions: (
    | "collect_depot"
    | "collect_outpost"
    | "cross_left_bump"
    | "cross_left_trench"
    | "cross_right_bump"
    | "cross_right_trench"
    | "shoot"
    | "climb"
  )[];
  expectedHubScores: number; // nonnegative integer
};

type PitReport = {
  user: {
    id: number; // positive integer
    firstName: string; // 1-30 characters
    lastName: string; // 1-30 characters
    avatarId: string | null; // UUID v4
  } | null;
  eventCode: string; // 5 characters
  teamNumber: number; // integer 1-20000
  drivetrain: Drivetrain;
  shooter: Shooter;
  estimatedBps: number; // positive
  indexer: Indexer;
  hopperCapacity: number; // positive integer
  climbLevel: number; // nonnegative integer <=3
  canPass: boolean;
  canDefend: boolean;
  canCrossBump: boolean;
  canCrossTrench: boolean;
  autoRoutines: AutoRoutine[];
  driverEvents: number; // nonnegative integer
  weightLbs: number; // positive integer
  notes: string; // <=400 characters
  photoId: string; // UUID v4
};
```

#### GET /pit-report/:id

Returns a pit scouting report. `id` must be a positive integer. If the report does not exist, a 404 status code is returned with `code` set to `REPORT_NOT_FOUND`. Upon success, a 200 status code is returned with `PitReport` for the schema.

#### POST /pit-report

Creates a pit scouting report. If the content type is not multipart/form-data, a 406 status code is returned with `code` set to `FST_INVALID_MULTIPART_CONTENT_TYPE`. If the form data is invalid, a 422 status code is returned with `code` set to `INVALID_FORM_DATA`. Upon success, a 201 status code is returned. The following schema is used for form data:
```ts
type Schema = {
  createdAt: string; // ISO 8601 date-time
  eventCode: string; // 5 characters
  teamNumber: number; // integer 1-20000
  drivetrain: Drivetrain;
  shooter: Shooter;
  estimatedBps: number | string; // positive, "" for an unknown amount
  indexer: Indexer;
  hopperCapacity: number; // positive integer
  climbLevel: number; // nonnegative integer <=3
  canPass: boolean;
  canDefend: boolean;
  canCrossBump: boolean;
  canCrossTrench: boolean;
  // string - use multiple fields with the same name and serialize each one as
  // JSON
  autoRoutines: AutoRoutine[];
  driverEvents: number; // nonnegative integer
  weightLbs: number; // positive
  notes: string; // <=400 characters
  photo: File | ""; // image, "" for no photo
};
```

#### POST /get-pit-reports

Returns a list of pit scouting reports. The following schema is used for the request body:
```ts
type Schema = {
  take: number; // positive integer
  skip: number; // nonnegative integer
}
```
A 200 status code is always returned with the following response body:
```ts
type Schema = {
  id: number; // positive integer
  eventCode: string; // 5 characters
  teamNumber: number; // integer 1-20000
  user: {
    id: number; // positive integer
    firstName: string; // 1-30 characters
    lastName: string; // 1-30 characters
    avatarId: string | null; // UUID v4
  } | null;
}[]
```

### Authentication

All authentication routes start with **/auth**. The user's ID can be accessed by decoding the access token and accessing the `id` value. Upon success, all authentication routes return a 201 status code with the following response body, except for **/auth/logout**:
```ts
type Schema = {
  accessToken: string; // JWT
  refreshToken: string; // UUID v4
};
```

#### POST /auth/sign-up

Creates an account. If the team password is not "AlexaIsOurScoutingLead!", a 401 status code is returned with `code` set to `INCORRECT_TEAM_PASSWORD`. If the username is taken, a 409 status code is returned with `code` set to `USERNAME_TAKEN`. The following schema is used for the request body:
```ts
type Schema = {
  username: string; // 1-30 characters
  password: string; // 1-50 characters
  firstName: string; // 1-50 characters
  lastName: string; // <=50 characters
  teamPassword: string; // >=1 character
};
```

#### POST /auth/login

Logs the user in. If the user does not exist, a 401 status code is returned with `code` set to `NO_SUCH_USER`. If the password is incorrect, a 401 status code is returned with `code` set to `INCORRECT_PASSWORD`. The following schema is used for the request body:
```ts
type Schema = {
  username: string; // 1-30 characters
  password: string; // 1-50 characters
};
```

#### POST /auth/logout

Logs the user out by deleting the refresh token. The request body must be the refresh token. A 204 status code is always returned.

#### POST /auth/refresh

Creates a new access token and rotates the refresh token. This should be called when the access token expires. The request body should be the refresh token. If the refresh token is invalid, a 401 status code with `code` set to `INVALID_REFRESH_TOKEN`. If the refresh token has already expired, a 401 status code is returned with `code` set to `EXPIRED_REFRESH_TOKEN`.

## Test User

There is a test user with a username of "testuser" and password of "4FeetTallRisith?45!" that is useful for development.
