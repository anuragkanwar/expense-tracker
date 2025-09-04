import { transaction } from "@pocket-pixie/db";
import { eq } from "drizzle-orm";
import { db as DATABASE } from "@pocket-pixie/db";

export class PassbookRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  // TODO: Implement methods
}
