import { sql } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";
import * as e from "./enums";

// Types of robots:
// cleanup - scoring from one spot
// ferrying
// shoveling
// defense
// cycle - go to neutral, go back, and score

export const users = p.pgTable("users", {
  id: p.serial("id").primaryKey(),
  username: p.varchar("username", { length: 30 }).unique().notNull(),
  passwordHash: p.varchar("password_hash", { length: 100 }).notNull(),
  firstName: p.varchar("first_name", { length: 50 }).notNull(),
  lastName: p.varchar("last_name", { length: 50 }).notNull(),
  avatarId: p.uuid("avatar_id").unique().default(sql`uuidv7()`),
});

export const refreshTokens = p.pgTable("refresh_tokens", {
  value: p.uuid("value").primaryKey().default(sql`uuidv7()`),
  userId: p
    .integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: p.timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const matchType = p.pgEnum("match_type", e.asList(e.MatchType));

export const alliance = p.pgEnum("alliance", e.asList(e.Alliance));

export const autoClimb = p.pgEnum("auto_climb", e.asList(e.AutoClimb));

export const reports = p.pgTable("reports", {
  id: p.serial("id").primaryKey(),
  userId: p
    .integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: p.timestamp("created_at", { withTimezone: true }).notNull(),
  eventCode: p.char("event_code", { length: 5 }).notNull(),
  matchType: matchType().$type<e.MatchType>().notNull(),
  matchNumber: p.smallint("match_number").notNull(),
  alliance: alliance().$type<e.Alliance>().notNull(),
  teamNumber: p.smallint("team_number").notNull(),
  inMatch: p.boolean("in_match").notNull(),
  notes: p.varchar("notes", { length: 400 }).notNull(),
  minorFouls: p.smallint("minor_fouls").notNull(),
  majorFouls: p.smallint("major_fouls").notNull(),
  secondsIncapacitated: p.smallint().notNull(),
  shootingConfidence: p.smallint("shooting_confidence").notNull(),

  autoHubScores: p.smallint("auto_hub_scores").notNull(),
  autoHubMisses: p.smallint("auto_hub_misses").notNull(),
  autoClimb: autoClimb().$type<e.AutoClimb>().notNull(),
  autoPasses: p.smallint("auto_passes").notNull(),
  autoNotes: p.varchar("auto_notes", { length: 400 }).notNull(),

  teleopHubScores: p.smallint("teleop_hub_scores").notNull(),
  teleopHubMisses: p.smallint("teleop_hub_misses").notNull(),
  teleopPasses: p.smallint("teleop_passes").notNull(),
  teleopDefended: p.boolean("teleop_defended").notNull(),
  teleopWasDefended: p.boolean("teleop_was_defended").notNull(),
  teleopNotes: p.varchar("teleop_notes", { length: 400 }).notNull(),

  endgameLevel: p.smallint("endgame_level").notNull(),
  endgameClimbFailed: p.boolean("endgame_climb_failed").notNull(),
  endgameNotes: p.varchar("endgame_notes", { length: 400 }).notNull(),
});

export const drivetrain = p.pgEnum("drivetrains", e.asList(e.Drivetrain));

export const shooter = p.pgEnum("shooters", e.asList(e.Shooter));

export const indexer = p.pgEnum("indexers", e.asList(e.Indexer));

export const pitReports = p.pgTable("pit_reports", {
  id: p.serial("id").primaryKey(),
  userId: p
    .integer("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  createdAt: p.timestamp("created_at", { withTimezone: true }).notNull(),
  eventCode: p.char("event_code", { length: 5 }).notNull(),
  teamNumber: p.smallint("team_number").notNull(),
  drivetrain: drivetrain("drivetrain").$type<e.Drivetrain>().notNull(),
  shooter: shooter("shooter").$type<e.Shooter>().notNull(),
  estimatedBps: p.decimal("estimated_bps").notNull(),
  indexer: indexer("indexer").$type<e.Indexer>().notNull(),
  hopperCapacity: p.smallint("hopper_capacity").notNull(),
  climbLevel: p.smallint("climb_level").notNull(),
  canPass: p.boolean("can_pass").notNull(),
  canDefend: p.boolean("can_defend").notNull(),
  canCrossBump: p.boolean("can_cross_bump").notNull(),
  canCrossTrench: p.boolean("can_cross_trench").notNull(),
  driverEvents: p.smallint("driver_events").notNull(),
  weightLbs: p.decimal("weights_lbs").notNull(),
  notes: p.varchar("notes", { length: 400 }).notNull(),
  photoId: p.uuid("photo_id").unique().notNull().default(sql`uuidv7()`),
});

export const startingPosition = p.pgEnum(
  "starting_position",
  e.asList(e.StartingPosition),
);

export const autoAction = p.pgEnum("auto_action", e.asList(e.AutoAction));

export const autoRoutines = p.pgTable("auto_routines", {
  id: p.serial("id").primaryKey(),
  reportId: p
    .integer()
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  startingPosition: startingPosition().$type<e.StartingPosition>().notNull(),
  actions: autoAction("actions").$type<e.AutoAction>().array().notNull(),
  expectedHubScores: p.smallint("expected_hub_scores").notNull(),
});
