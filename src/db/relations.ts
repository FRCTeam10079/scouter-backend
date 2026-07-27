import { defineRelations } from "drizzle-orm";
import {
  autoRoutines,
  pitReports,
  refreshTokens,
  reports,
  users,
} from "./schema";

const relations = defineRelations(
  {
    users,
    refreshTokens,
    reports,
    pitReports,
    autoRoutines,
  },
  (r) => ({
    users: {
      refreshTokens: r.many.refreshTokens(),
      reports: r.many.reports(),
      pitReports: r.many.pitReports(),
    },
    refreshTokens: {
      user: r.one.users({
        from: r.refreshTokens.userId,
        to: r.users.id,
      }),
    },
    reports: {
      user: r.one.users({
        from: r.reports.userId,
        to: r.users.id,
      }),
    },
    pitReports: {
      user: r.one.users({
        from: r.pitReports.userId,
        to: r.users.id,
      }),
      autoRoutines: r.many.autoRoutines(),
    },
    autoRoutines: {
      report: r.one.pitReports({
        from: r.autoRoutines.reportId,
        to: r.pitReports.id,
      }),
    },
  }),
);

export default relations;
