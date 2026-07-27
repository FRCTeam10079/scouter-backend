export enum MatchType {
  Qual = "qual",
  Playoff = "playoff",
}

export enum Alliance {
  Red = "red",
  Blue = "blue",
}

export enum AutoClimb {
  None = "none",
  Level1 = "level1",
  Failed = "failed",
}

export enum Drivetrain {
  Swerve = "swerve",
  Tank = "tank",
  Mechanum = "mecanum",
}

export enum Shooter {
  Single = "single",
  Dual = "dual",
  Triple = "triple",
  Quad = "quad",
  Turret = "turret",
  DualTurret = "dual_turret",
  Drum = "drum",
  Other = "other",
}

export enum Indexer {
  Vertical = "vertical",
  Spindexer = "spindexer",
  Roller = "roller",
  Belt = "belt",
  Gravity = "gravity",
}

export enum StartingPosition {
  Left = "left",
  LeftBump = "left_bump",
  LeftTrench = "left_trench",
  Center = "center",
  Right = "right",
  RightBump = "right_bump",
  RightTrench = "right_trench",
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

export function asList(e: Record<string, string>): [string, ...string[]] {
  return Object.values(e) as [string, ...string[]];
}
