import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/loginPage';
import { DashboardPage } from '../pages/dashboardPage';
import { NavBar } from '../pages/navBar';
import { AccessDeniedPage } from '../pages/accessDeniedPage';
import { AlertsPage } from '../pages/alertsPage';

type Pages = {
  loginPage: LoginPage;
  navBar: NavBar;
  dashboardPage: DashboardPage;
  alertsPage: AlertsPage;
  accessDeniedPage: AccessDeniedPage;
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
});

export const { Given, When, Then, Before, After } = createBdd(test);
