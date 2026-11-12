import { test as base, createBdd } from 'playwright-bdd';
import { LoginPage } from '../pages/loginPage';
import { DashboardPage } from '../pages/dashboardPage';
import { NavBar } from '../pages/navBar';

type Pages = {
  loginPage: LoginPage;
  navBar: NavBar;
  dashboardPage: DashboardPage;
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
});

export const { Given, When, Then, Before, After } = createBdd(test);
