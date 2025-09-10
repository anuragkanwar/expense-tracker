import {
  PassbookRepository,
  PassbookFilters,
  PassbookQueryResult,
  PassbookEntryResponse,
} from "@/repositories/passbook-repository";
import { BadRequestError } from "@/errors/base-error";

export class PassbookService {
  private readonly passbookRepository;

  constructor({
    passbookRepository,
  }: {
    passbookRepository: PassbookRepository;
  }) {
    this.passbookRepository = passbookRepository;
  }

  async getPassbookEntries(
    userId: number,
    page: number = 1,
    limit: number = 20,
    filters: PassbookFilters = {}
  ): Promise<PassbookQueryResult> {
    // Validate inputs
    if (!userId || typeof userId !== "number") {
      throw new BadRequestError("Invalid user ID");
    }

    if (page < 1) {
      throw new BadRequestError("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestError("Limit must be between 1 and 100");
    }

    // Validate date range
    if (
      filters.startDate &&
      filters.endDate &&
      filters.startDate > filters.endDate
    ) {
      throw new BadRequestError("Start date cannot be after end date");
    }

    // Parse string dates to Date objects if provided
    const parsedFilters: PassbookFilters = { ...filters };

    if (typeof filters.startDate === "string") {
      parsedFilters.startDate = new Date(filters.startDate);
    }

    if (typeof filters.endDate === "string") {
      parsedFilters.endDate = new Date(filters.endDate);
    }

    return this.passbookRepository.getPassbookEntries(
      userId,
      page,
      limit,
      parsedFilters
    );
  }

  async getPassbookEntryById(
    userId: number,
    entryId: number
  ): Promise<PassbookEntryResponse | null> {
    // Validate inputs
    if (!userId || typeof userId !== "number") {
      throw new BadRequestError("Invalid user ID");
    }

    if (!entryId || typeof entryId !== "number") {
      throw new BadRequestError("Invalid entry ID");
    }

    const entry = await this.passbookRepository.getPassbookEntryById(
      userId,
      entryId
    );

    // Additional business logic can be added here
    // For example: check if user has permission to view this entry
    // or add additional computed fields

    return entry;
  }

  async getPassbookSummary(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalEntries: number;
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  }> {
    // Get all entries for the period (without pagination)
    const result = await this.getPassbookEntries(userId, 1, 10000, {
      startDate,
      endDate,
    });

    const totalCredits = result.entries
      .filter((entry) => entry.amount > 0)
      .reduce((sum, entry) => sum + entry.amount, 0);

    const totalDebits = Math.abs(
      result.entries
        .filter((entry) => entry.amount < 0)
        .reduce((sum, entry) => sum + entry.amount, 0)
    );

    return {
      totalEntries: result.total,
      totalCredits,
      totalDebits,
      netAmount: totalCredits - totalDebits,
      dateRange: {
        start: startDate?.toISOString() || null,
        end: endDate?.toISOString() || null,
      },
    };
  }
}
