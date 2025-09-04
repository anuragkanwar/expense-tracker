import { RecurringRepository } from "@/repositories/recurring-repository";

export class RecurringService {
  private readonly recurringRepository;

  constructor({
    recurringRepository,
  }: {
    recurringRepository: RecurringRepository;
  }) {
    this.recurringRepository = recurringRepository;
  }

  // TODO: Implement recurring service methods
}
