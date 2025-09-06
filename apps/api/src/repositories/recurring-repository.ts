import { recurring } from "@/db";
import { eq } from "drizzle-orm";
import { db as DATABASE } from "@/db";

export class RecurringRepository {
  private db: typeof DATABASE;
  constructor({ db }: { db: typeof DATABASE }) {
    this.db = db;
  }

  // TODO: Implement methods
}
