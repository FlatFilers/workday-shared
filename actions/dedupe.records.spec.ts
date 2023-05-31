import api, { Flatfile } from "@flatfile/api";
import { DedupeRecords } from "./dedupe.records"; // Change this as per your file structure

jest.mock("@flatfile/api", () => ({
  __esModule: true,
  default: {
    records: {
      get: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
  },
}));

describe("DedupeRecords", () => {
  const mockApi = api as jest.Mocked<typeof api>;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  const sheetId = "sheet1";
  const mergeKey = "key1";

  test("should call all methods correctly", async () => {
    const dedupeRecords = new DedupeRecords(sheetId, mergeKey);

    const mockRecord1: Flatfile.RecordWithLinks = {
      id: "1",
      values: { [mergeKey]: { value: "A" } },
    };

    const mockRecord2: Flatfile.RecordWithLinks = {
      id: "2",
      values: { [mergeKey]: { value: "A" } },
    };

    const mockRecord3: Flatfile.RecordWithLinks = {
      id: "3",
      values: { [mergeKey]: { value: "B" } },
    };

    const mockRecordsResponse = {
      data: {
        records: [mockRecord1, mockRecord2, mockRecord3],
        counts: { total: 3 },
      },
    };

    // @ts-ignore
    mockApi.records.get.mockResolvedValue(mockRecordsResponse);

    await dedupeRecords.dedupeRecords();

    expect(mockApi.records.get).toHaveBeenCalledTimes(1);
    expect(mockApi.records.delete).toHaveBeenCalledTimes(1);
    expect(mockApi.records.update).toHaveBeenCalledTimes(1);
  });

  test("should handle pagination correctly", async () => {
    const dedupeRecords = new DedupeRecords(sheetId, mergeKey);

    const mockRecord1: Flatfile.RecordWithLinks = {
      id: "1",
      values: { [mergeKey]: { value: "A" } },
    };

    const mockRecord2: Flatfile.RecordWithLinks = {
      id: "2",
      values: { [mergeKey]: { value: "A" } },
    };

    const mockRecordsResponse1 = {
      data: {
        records: [mockRecord1],
        counts: { total: 2000 },
      },
    };

    const mockRecordsResponse2 = {
      data: {
        records: [mockRecord2],
      },
    };

    mockApi.records.get
      // @ts-ignore
      .mockResolvedValueOnce(mockRecordsResponse1)
      .mockResolvedValueOnce(mockRecordsResponse2);

    await dedupeRecords.dedupeRecords();

    expect(mockApi.records.get).toHaveBeenCalledTimes(2);
    expect(mockApi.records.delete).toHaveBeenCalledTimes(1);
    expect(mockApi.records.update).toHaveBeenCalledTimes(1);
  });

  test("should handle record deletion chunking correctly", async () => {
    const dedupeRecords = new DedupeRecords(sheetId, mergeKey);

    const records = new Array(102).fill(null).map((_, i) => ({
      id: `${i + 1}`,
      values: { [mergeKey]: { value: "A" } },
    }));

    const mockRecordsResponse = {
      data: {
        records,
        counts: { total: records.length },
      },
    };

    // @ts-ignore
    mockApi.records.get.mockResolvedValue(mockRecordsResponse);

    await dedupeRecords.dedupeRecords();

    expect(mockApi.records.delete).toHaveBeenCalledTimes(2); // One for each batch of 100 and one for the remaining record
  });
  // Test for chunking in updateRemainingRecords
  test("should handle record update chunking correctly", async () => {
    const dedupeRecords = new DedupeRecords(sheetId, mergeKey);

    // Create 2000+ records, with every two records having the same merge key
    const records = new Array(2001).fill(null).map((_, i) => ({
      id: `${i + 1}`,
      values: { [mergeKey]: { value: `${Math.floor(i / 2) + 1}` } },
    }));

    const mockRecordsResponse = {
      data: {
        records,
        counts: { total: records.length },
      },
    };

    // @ts-ignore
    mockApi.records.get.mockResolvedValue(mockRecordsResponse);

    await dedupeRecords.dedupeRecords();

    expect(mockApi.records.update).toHaveBeenCalledTimes(2); // One for each batch of 1000 and one for the remaining records
  });
});
