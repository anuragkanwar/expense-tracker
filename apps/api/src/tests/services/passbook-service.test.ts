import { describe, it, expect, vi, beforeEach } from "vitest";
import { PassbookService } from "../../services/passbook-service";
import { BadRequestError } from "../../errors/base-error";

describe("PassbookService", () => {
  let passbookService: PassbookService;
  const mockPassbookRepository = {
    getPassbookEntries: vi.fn(),
    getPassbookEntryById: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    passbookService = new PassbookService({
      passbookRepository: mockPassbookRepository as any,
    });
  });

  describe("getPassbookEntries", () => {
    it("should throw error for invalid user ID", async () => {
      await expect(
        passbookService.getPassbookEntries(null as any)
      ).rejects.toThrow(BadRequestError);
      await expect(
        passbookService.getPassbookEntries("123" as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid page number", async () => {
      await expect(passbookService.getPassbookEntries(1, 0)).rejects.toThrow(
        BadRequestError
      );
      await expect(passbookService.getPassbookEntries(1, -1)).rejects.toThrow(
        BadRequestError
      );
    });

    it("should throw error for invalid limit", async () => {
      await expect(passbookService.getPassbookEntries(1, 1, 0)).rejects.toThrow(
        BadRequestError
      );
      await expect(
        passbookService.getPassbookEntries(1, 1, 101)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error if startDate is after endDate", async () => {
      const startDate = new Date("2025-02-01");
      const endDate = new Date("2025-01-01");
      await expect(
        passbookService.getPassbookEntries(1, 1, 10, {
          startDate,
          endDate,
        })
      ).rejects.toThrow(BadRequestError);
    });

    it("should call repository with correct filters", async () => {
      const mockResult = {
        entries: [],
        total: 0,
        page: 1,
        limit: 10,
      };
      mockPassbookRepository.getPassbookEntries.mockResolvedValue(mockResult);

      const filters = {
        startDate: new Date("2025-01-01"),
        endDate: new Date("2025-02-01"),
        categoryId: 123,
        accountId: 456,
        entryType: "expense" as const,
        status: "unpaid" as const,
      };

      await passbookService.getPassbookEntries(1, 1, 10, filters);

      expect(mockPassbookRepository.getPassbookEntries).toHaveBeenCalledWith(
        1,
        1,
        10,
        filters
      );
    });
  });

  describe("getPassbookEntryById", () => {
    it("should throw error for invalid user ID", async () => {
      await expect(
        passbookService.getPassbookEntryById(null as any, 1)
      ).rejects.toThrow(BadRequestError);
    });

    it("should throw error for invalid entry ID", async () => {
      await expect(
        passbookService.getPassbookEntryById(1, null as any)
      ).rejects.toThrow(BadRequestError);
    });

    it("should call repository with correct parameters", async () => {
      const mockEntry = { id: 1 };
      mockPassbookRepository.getPassbookEntryById.mockResolvedValue(mockEntry);

      const result = await passbookService.getPassbookEntryById(1, 1);

      expect(mockPassbookRepository.getPassbookEntryById).toHaveBeenCalledWith(
        1,
        1
      );
      expect(result).toEqual(mockEntry);
    });
  });
});
