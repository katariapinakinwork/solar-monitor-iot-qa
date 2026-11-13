export const ROUTES = {
  login: '/Account/Login',
  accessDenied: '/Account/AccessDenied',
  dashboard: '/',
  plants: '/Plants',
  alerts: '/Alerts',
  acknowledgeAlert: '/Alerts/Acknowledge',
  reports: '/Reports',
} as const;

export const SESSION_COOKIE = '.AspNetCore.Cookies';

export const PLANT_STATUSES = [
    'Online', 
    'Offline', 
    'Maintenance', 
    'Degraded'
] as const;

export type PlantStatus = (typeof PLANT_STATUSES)[number];

export const ALERT_SEVERITIES = [
    'Critical', 
    'Warning', 
    'Info'
] as const;