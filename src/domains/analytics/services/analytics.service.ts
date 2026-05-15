import {
  getDashboardKpis,
  getSalesChart
}
from '../repositories/analytics.repository';

export async function fetchDashboardKpis() {

  return getDashboardKpis();
}

export async function fetchSalesChart() {

  return getSalesChart();
}
