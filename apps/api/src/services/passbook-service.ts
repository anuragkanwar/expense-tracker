import { PassbookRepository } from "@/repositories/passbook-repository";

export class PassbookService {
  private readonly passbookRepository;

  constructor({
    passbookRepository,
  }: {
    passbookRepository: PassbookRepository;
  }) {
    this.passbookRepository = passbookRepository;
  }

  // TODO: Implement passbook service methods
}
