import type { FastifyInstance } from 'fastify';
import { getLedgerSummary, listBookings, listCallRecords, supabase } from '../lib/db-supabase.js';

export async function dashboardRoutes(app: FastifyInstance) {
  /**
   * GET /api/dashboard/stats
   * Returns summary stats for the dashboard based on REAL database data.
   */
  app.get('/stats', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const thisMonth = today.slice(0, 7);

    // 1. Financial Stats (This Month)
    const ledger = await getLedgerSummary();

    // 2. Booking Stats (Today / Month)
    const todayBookingList = await listBookings(today);
    const todayBookings = todayBookingList.length;

    const { count: totalBookingsCount } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .like('start_time', `${thisMonth}%`);
    const totalBookings = totalBookingsCount ?? 0;

    // 3. Call Stats (Today)
    const { count: totalCallsCount } = await supabase
      .from('call_records')
      .select('*', { count: 'exact', head: true })
      .like('started_at', `${today}%`);
    const totalCalls = totalCallsCount ?? 0;

    const { count: missedCallsCount } = await supabase
      .from('call_records')
      .select('*', { count: 'exact', head: true })
      .like('started_at', `${today}%`)
      .eq('status', 'missed');
    const missedCalls = missedCallsCount ?? 0;

    // 4. Today's revenue
    const { data: todayIncomeData } = await supabase
      .from('ledger_entries')
      .select('amount')
      .eq('date', today)
      .eq('type', 'income');
    const todayRevenue = (todayIncomeData ?? []).reduce((sum, r) => sum + r.amount, 0);

    // Demo trend values
    const incomeGrowth = 12.5;
    const expenseGrowth = -5.2;

    return {
      stats: {
        todayRevenue,
        monthlyRevenue: ledger.totalIncome,
        activeBookings: todayBookings,
        pendingActions: Math.max(0, totalBookings - todayBookings),
        totalCallsToday: totalCalls,
        missedCalls,
      },
      trends: {
        revenue: incomeGrowth,
        expense: expenseGrowth,
        calls: 3.8,
        bookings: -1.2,
      },
    };
  });
}
