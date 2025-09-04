import { DashboardRepository } from "@/repositories/dashboard-repository";

export class DashboardService {
  private readonly dashboardRepository;

  constructor({
    dashboardRepository,
  }: {
    dashboardRepository: DashboardRepository;
  }) {
    this.dashboardRepository = dashboardRepository;
  }

  // TODO: Implement dashboard service methods
}
