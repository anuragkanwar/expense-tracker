import { db as DATABASE } from "@pocket-pixie/db";

export class DashboardRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  // TODO: Implement dashboard aggregation methods
}
