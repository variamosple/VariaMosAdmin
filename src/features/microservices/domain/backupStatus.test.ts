import { type BackupReport, backupSummaryOf } from "./backupStatus";

const NOW = new Date("2026-11-15T07:30:00Z");

const report = (overrides: Partial<BackupReport> = {}): BackupReport => ({
  configured: true,
  status: {
    file: "db_backup_2026-11-15-02-00-01.sql.gz",
    createdAt: "2026-11-15T02:00:59Z",
    sizeBytes: 69087000,
  },
  problems: [],
  ...overrides,
});

describe("backup summary (EV-86)", () => {
  it("gives the age and size of a sound backup", () => {
    expect(backupSummaryOf(report(), NOW)).toEqual({
      ok: true,
      text: "Last database backup: 5 hours ago, 65.9 MB, intact.",
    });
  });

  it("says less than an hour, or one hour", () => {
    expect(
      backupSummaryOf(report(), new Date("2026-11-15T02:30:00Z"))?.text,
    ).toBe("Last database backup: less than an hour ago, 65.9 MB, intact.");
    expect(
      backupSummaryOf(report(), new Date("2026-11-15T03:30:00Z"))?.text,
    ).toBe("Last database backup: 1 hour ago, 65.9 MB, intact.");
  });

  it("gives the problems found by the admin", () => {
    expect(
      backupSummaryOf(
        report({
          problems: [
            { kind: "corrupt", message: "The last backup is damaged." },
            { kind: "shrunk", message: "It is half the size." },
          ],
        }),
        NOW,
      ),
    ).toEqual({
      ok: false,
      text: "Database backup: The last backup is damaged. It is half the size.",
    });
  });

  it("shows nothing when the admin does not follow the backups", () => {
    expect(
      backupSummaryOf(report({ configured: false, status: null }), NOW),
    ).toBeNull();
  });
});
