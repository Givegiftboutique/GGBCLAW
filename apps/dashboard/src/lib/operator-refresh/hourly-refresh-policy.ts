export type RefreshSource = "manual" | "hourly" | "initial-load";

export interface HourlyRefreshState {
  refreshIntervalMinutes: 60;
  lastRefreshAt: string;
  nextRefreshAt: string;
  refreshSource: RefreshSource;
  externalFetchEnabled: false;
  productionFetchEnabled: false;
  localReportsOnly: true;
  watchedReports: string[];
}
