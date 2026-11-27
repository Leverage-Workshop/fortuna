// Number and date formats from DESIGN.md §4: probabilities as `62%`, money as `$0.41`, and an
// em dash for a value that wasn't recorded (never a zero, which would read as data).

const MISSING = "—";
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatPercent(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

export function formatUsd(amount: number | null): string {
  if (amount === null) return MISSING;
  if (amount > 0 && amount < 0.005) return "<$0.01";
  return `$${amount.toFixed(2)}`;
}

export function formatCount(n: number | null): string {
  return n === null ? MISSING : n.toLocaleString("en-US");
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return MISSING;
  if (ms < 1000) return `${Math.round(ms)} ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)} s`;
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} m ${seconds.toString().padStart(2, "0")} s`;
}

/** A Postgres `date` (`YYYY-MM-DD`), formatted from its parts so no timezone can shift the day. */
export function formatDate(isoDate: string | null): string {
  if (isoDate === null) return MISSING;
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export function formatTimestamp(at: Date | null): string {
  if (at === null) return MISSING;
  return `${at.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
