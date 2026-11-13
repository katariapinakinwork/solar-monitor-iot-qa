import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/loginPage';
import { DashboardPage } from '../pages/dashboardPage';
import { NavBar } from '../pages/navBar';
import { AccessDeniedPage } from '../pages/accessDeniedPage';
import { AlertsPage } from '../pages/alertsPage';
import { PlantDetailPage } from '../pages/plantDetailPage';
import { PlantsPage } from '../pages/plantPage';
import { ScenarioContext } from '../types/context';
import { ReportsPage } from '../pages/reportsPage';
import { UiPage } from '../pages/uiPage';

type Pages = {
  loginPage: LoginPage;
  navBar: NavBar;
  dashboardPage: DashboardPage;
  plantsPage: PlantsPage;
  plantDetailPage: PlantDetailPage;
  alertsPage: AlertsPage;
  accessDeniedPage: AccessDeniedPage;
  reportsPage: ReportsPage;
  uiPage: UiPage;
  ctx: ScenarioContext;
};


export const test = base.extend<Pages>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  navBar: async ({ page }, use) => {
    await use(new NavBar(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  alertsPage: async ({ page }, use) => {
    await use(new AlertsPage(page));
  },
  accessDeniedPage: async ({ page }, use) => {
    await use(new AccessDeniedPage(page));
  },
  plantsPage: async ({ page }, use) => {
    await use(new PlantsPage(page));
  },
  plantDetailPage: async ({ page }, use) => {
    await use(new PlantDetailPage(page));
  },
  reportsPage: async ({ page }, use) => {
    await use(new ReportsPage(page));
  },
  uiPage: async ({ page }, use) => {
    await use(new UiPage(page));
  },
  // A fresh, empty store for every scenario.
  ctx: async ({}, use) => {
    await use({ plants: [], statusCounts: {}, values: {} });
  },
});

export const { Given, When, Then, Before, After } = createBdd(test);
