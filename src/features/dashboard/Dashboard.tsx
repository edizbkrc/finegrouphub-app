"use client";

/**
 * Ana sayfa — eski panelin (finehub-app) panosundan türedi: kullanıcı o düzeni istedi (bakiye +
 * gelir/gider grafiği, son aktiviteler, proje/firma durumu), sonra geliştirilmesini istedi.
 * Uçlar ve izin davranışı aynı: 403 dönen bölüm gizlenir, diğerleri çalışmaya devam eder.
 */
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { alpha, useTheme } from "@mui/material/styles";
import { Avatar, Box, Button, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import Grid from "@mui/material/Grid";
import ApartmentIcon from "@mui/icons-material/Apartment";
import BusinessIcon from "@mui/icons-material/Business";
import RequestQuoteIcon from "@mui/icons-material/RequestQuote";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import axiosInstance from "@network/axiosInstance";
import { ApiRoutes } from "@network/ApiRoutes";
import { Routes } from "@enums/Routes";
import useProfileInfo from "@hooks/useProfileInfo";
import getLocalizedMoment from "@helpers/Date/getLocalizedMoment";
import {
  calculateTotalFromMonthlyData,
  calculateTotalOrdersFromMonthlyData,
  formatCurrency,
} from "@helpers/dashboard/dashboardHelpers";
import type { DashboardGeneralData, ExpenseRevenueData, OrdersData } from "@/types/dashboard";
import DashboardSkeleton from "./DashboardSkeleton";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface IActivity {
  userName?: string | null;
  activityDescription?: string | null;
  activityDate?: string | null;
}

interface IDashboardState {
  general: DashboardGeneralData | null;
  expenseRevenue: ExpenseRevenueData | null;
  orders: OrdersData | null;
  activities: IActivity[] | null;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Ay dizisini 12 aya tamamlar; API yalnız hareketli ayları döndürebilir. */
const byMonth = <T extends { month: number }>(rows: T[] | undefined, pick: (row: T) => number) =>
  MONTHS.map((month) => {
    const row = rows?.find((item) => item.month === month);
    return row ? pick(row) : 0;
  });

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 100) : 0);

/** 403 dışındaki hatada bölüm boş görünür ama gizlenmez — veri yok ile yetki yok ayrı şeyler. */
const forbidden = (result: PromiseSettledResult<unknown>) =>
  result.status === "rejected" &&
  (result.reason as { response?: { status?: number } } | undefined)?.response?.status === 403;

function SectionCard({ children, sx }: { children: ReactNode; sx?: object }) {
  return (
    <Paper
      elevation={0}
      sx={{ p: { xs: 2, md: 2.5 }, height: "100%", border: 1, borderColor: "divider", borderRadius: 3, ...sx }}
    >
      {children}
    </Paper>
  );
}

function FinanceTile({
  icon,
  label,
  value,
  share,
  shareLabel,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  share: number;
  shareLabel: string;
  color: string;
}) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2.5,
        bgcolor: alpha(color, 0.08),
        border: 1,
        borderColor: alpha(color, 0.2),
        display: "flex",
        alignItems: "center",
        gap: 2,
        height: "100%",
      }}
    >
      <Image src={icon} alt="" width={56} height={56} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={700} noWrap>
          {value}
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.75 }}>
          <LinearProgress
            variant="determinate"
            value={share}
            sx={{
              flex: 1,
              height: 6,
              borderRadius: 3,
              bgcolor: alpha(color, 0.15),
              "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
            {shareLabel} %{share}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
}

function KpiCard({
  href,
  icon,
  label,
  value,
  caption,
  progress,
  color,
}: {
  href: string;
  icon: ReactNode;
  label: string;
  value: string;
  caption: string;
  progress?: number;
  color: string;
}) {
  return (
    <Paper
      component={Link}
      href={href}
      elevation={0}
      sx={{
        p: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        textDecoration: "none",
        color: "inherit",
        transition: "border-color .2s, transform .2s",
        "&:hover": { borderColor: color, transform: "translateY(-2px)" },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: alpha(color, 0.12), color }}>
          {icon}
        </Avatar>
        <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
          {label}
        </Typography>
        <ArrowForwardIcon fontSize="small" sx={{ color: "text.disabled" }} />
      </Stack>
      <Typography variant="h5" fontWeight={700}>
        {value}
      </Typography>
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            bgcolor: alpha(color, 0.12),
            "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 },
          }}
        />
      )}
      <Typography variant="caption" color="text.secondary">
        {caption}
      </Typography>
    </Paper>
  );
}

const Dashboard = () => {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const theme = useTheme();
  const { profileInfo } = useProfileInfo();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<IDashboardState>({
    general: null,
    expenseRevenue: null,
    orders: null,
    activities: null,
  });
  const [allowed, setAllowed] = useState({ general: true, expense: true, orders: true, activity: true });

  useEffect(() => {
    const quiet = { withoutToast: true, withoutErrorToast: true };
    Promise.allSettled([
      axiosInstance.get(ApiRoutes.DashboardGeneral, quiet),
      axiosInstance.get(ApiRoutes.DashboardExpenseRevenues, quiet),
      axiosInstance.get(ApiRoutes.DashboardOrders, quiet),
      axiosInstance.patch(ApiRoutes.ActivityLogs, { pageNumber: 1, rowCount: 8 }, quiet),
    ]).then(([general, expense, orders, activity]) => {
      const value = <T,>(result: PromiseSettledResult<{ data?: { data?: T } }>) =>
        result.status === "fulfilled" ? (result.value.data?.data ?? null) : null;
      setData({
        general: value<DashboardGeneralData>(general),
        expenseRevenue: value<ExpenseRevenueData>(expense),
        orders: value<OrdersData>(orders),
        activities: value<IActivity[]>(activity),
      });
      setAllowed({
        general: !forbidden(general),
        expense: !forbidden(expense),
        orders: !forbidden(orders),
        activity: !forbidden(activity),
      });
      setLoading(false);
    });
  }, []);

  const incomeColor = theme.palette.success.main;
  const expenseColor = theme.palette.error.main;

  const income = data.expenseRevenue ? calculateTotalFromMonthlyData(data.expenseRevenue.monthlyIncomes) : 0;
  const expense = data.expenseRevenue ? calculateTotalFromMonthlyData(data.expenseRevenue.monthlyExpenses) : 0;
  const balance = income - expense;
  const flowTotal = income + expense;

  const chart = useMemo(() => {
    // Ay adları dile göre (eski panelde "Jan, Feb…" sabitti).
    const monthName = new Intl.DateTimeFormat(locale, { month: "short" });
    const labels = MONTHS.map((month) => monthName.format(new Date(2024, month - 1, 1)));
    const area = (color: string) => (context: ScriptableContext<"line">) => {
      const { chartArea, ctx } = context.chart;
      if (!chartArea) return alpha(color, 0.15);
      const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
      gradient.addColorStop(0, alpha(color, 0.28));
      gradient.addColorStop(1, alpha(color, 0));
      return gradient;
    };
    const line = (label: string, values: number[], color: string) => ({
      label,
      data: values,
      borderColor: color,
      backgroundColor: area(color),
      fill: true,
      tension: 0.4,
      borderWidth: 2.5,
      pointRadius: 0,
      pointHoverRadius: 5,
      pointBackgroundColor: color,
    });

    const chartData: ChartData<"line"> = {
      labels,
      datasets: [
        line(t("Income"), byMonth(data.expenseRevenue?.monthlyIncomes, (row) => row.totalAmount), incomeColor),
        line(t("Expense"), byMonth(data.expenseRevenue?.monthlyExpenses, (row) => row.totalAmount), expenseColor),
      ],
    };

    const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
    const options: ChartOptions<"line"> = {
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (item) => ` ${item.dataset.label}: ${formatCurrency(Number(item.raw) || 0)}` },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: theme.palette.text.secondary } },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: { color: theme.palette.divider },
          ticks: { color: theme.palette.text.secondary, callback: (value) => compact.format(Number(value)) },
        },
      },
    };
    return { chartData, options };
  }, [data.expenseRevenue, locale, t, theme, incomeColor, expenseColor]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  const base = `/${locale}`;
  const general = data.general;
  const orderCount = data.orders ? calculateTotalOrdersFromMonthlyData(data.orders.monthlyOrders) : 0;
  const activities = data.activities ?? [];

  const dayLabel = (date: string | null | undefined) => {
    const day = getLocalizedMoment(date ?? undefined);
    if (day.isSame(getLocalizedMoment(), "day")) return t("Today");
    if (day.isSame(getLocalizedMoment().subtract(1, "day"), "day")) return t("Yesterday");
    return day.format("D MMMM");
  };

  const fullName = [profileInfo?.name, profileInfo?.surname].filter(Boolean).join(" ");

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box>
        <Typography variant="h5" fontWeight={700}>
          {fullName ? t("Welcome", { name: fullName }) : t("root")}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getLocalizedMoment().format("D MMMM YYYY, dddd")}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {allowed.expense && (
          <Grid size={{ xs: 12, lg: allowed.activity ? 8 : 12 }}>
            <SectionCard>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                spacing={1}
              >
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {t("TotalBalance")} · {t("ThisYear")}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} color={balance < 0 ? "error.main" : "text.primary"}>
                    {formatCurrency(balance)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={2}>
                  {[
                    { label: t("Income"), color: incomeColor },
                    { label: t("Expense"), color: expenseColor },
                  ].map((item) => (
                    <Stack key={item.label} direction="row" alignItems="center" spacing={0.75}>
                      <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color }} />
                      <Typography variant="caption" color="text.secondary">
                        {item.label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Stack>

              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FinanceTile
                    icon="/svgs/dashboard-renevue.svg"
                    label={t("Income")}
                    value={formatCurrency(income)}
                    share={percent(income, flowTotal)}
                    shareLabel={t("Share")}
                    color={incomeColor}
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  <FinanceTile
                    icon="/svgs/dashboard-expense.svg"
                    label={t("Expense")}
                    value={formatCurrency(expense)}
                    share={percent(expense, flowTotal)}
                    shareLabel={t("Share")}
                    color={expenseColor}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
                {t("MonthlyIncomeExpense")}
              </Typography>
              <Box sx={{ height: 280 }}>
                <Line data={chart.chartData} options={chart.options} />
              </Box>
            </SectionCard>
          </Grid>
        )}

        {allowed.activity && (
          <Grid size={{ xs: 12, lg: allowed.expense ? 4 : 12 }}>
            <SectionCard sx={{ display: "flex", flexDirection: "column" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  {t("RecentActivities")}
                </Typography>
                <Button component={Link} href={`${base}${Routes.ActivityLogs}`} size="small" endIcon={<ArrowForwardIcon />}>
                  {t("SeeAll")}
                </Button>
              </Stack>

              {activities.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                  {t("NoActivity")}
                </Typography>
              ) : (
                <Box sx={{ flex: 1, overflowY: "auto", maxHeight: { lg: 520 } }}>
                  {activities.map((activity, index) => {
                    const day = dayLabel(activity.activityDate);
                    const showDay = index === 0 || dayLabel(activities[index - 1]?.activityDate) !== day;
                    const isLast = index === activities.length - 1;
                    return (
                      <Box key={`${activity.activityDate}-${index}`}>
                        {showDay && (
                          <Typography
                            variant="overline"
                            color="text.secondary"
                            sx={{ display: "block", mt: index === 0 ? 0 : 1.5, mb: 0.5, lineHeight: 1.5 }}
                          >
                            {day}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1.5}>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ width: 38, flexShrink: 0, pt: 0.25, fontVariantNumeric: "tabular-nums" }}
                          >
                            {getLocalizedMoment(activity.activityDate ?? undefined).format("HH:mm")}
                          </Typography>
                          <Stack alignItems="center" sx={{ pt: 0.6 }}>
                            <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "primary.main" }} />
                            {!isLast && <Box sx={{ width: 2, flex: 1, minHeight: 28, bgcolor: "divider", my: 0.5 }} />}
                          </Stack>
                          <Box sx={{ pb: isLast ? 0 : 1.5, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {activity.activityDescription}
                            </Typography>
                            {activity.userName && (
                              <Typography variant="caption" color="text.secondary">
                                {activity.userName}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </SectionCard>
          </Grid>
        )}
      </Grid>

      {(allowed.general || allowed.orders) && (
        <Grid container spacing={3}>
          {allowed.general && general && (
            <>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <KpiCard
                  href={`${base}${Routes.Projects}`}
                  icon={<ApartmentIcon />}
                  label={t("ActiveProjects")}
                  value={`${general.activeProjectCount} / ${general.totalProjectCount}`}
                  progress={percent(general.activeProjectCount, general.totalProjectCount)}
                  caption={t("OfTotal", { total: general.totalProjectCount })}
                  color={theme.palette.primary.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <KpiCard
                  href={`${base}${Routes.Companies}`}
                  icon={<BusinessIcon />}
                  label={t("ActiveCompanies")}
                  value={`${general.activeCompanyCount} / ${general.totalCompanyCount}`}
                  progress={percent(general.activeCompanyCount, general.totalCompanyCount)}
                  caption={t("OfTotal", { total: general.totalCompanyCount })}
                  color={theme.palette.info.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <KpiCard
                  href={`${base}${Routes.Offers}`}
                  icon={<RequestQuoteIcon />}
                  label={t("PositiveOffers")}
                  value={`${general.positiveOfferCount} / ${general.totalOfferCount}`}
                  progress={percent(general.positiveOfferCount, general.totalOfferCount)}
                  caption={t("OfTotal", { total: general.totalOfferCount })}
                  color={theme.palette.success.main}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 2.4 }}>
                <KpiCard
                  href={`${base}${Routes.Tickets}`}
                  icon={<SupportAgentIcon />}
                  label={t("OpenTickets")}
                  value={String(general.unresolvedTicketCount)}
                  progress={percent(
                    general.totalTicketCount - general.unresolvedTicketCount,
                    general.totalTicketCount,
                  )}
                  caption={t("ResolvedOfTotal", {
                    resolved: general.totalTicketCount - general.unresolvedTicketCount,
                    total: general.totalTicketCount,
                  })}
                  color={theme.palette.warning.main}
                />
              </Grid>
            </>
          )}
          {allowed.orders && data.orders && (
            <Grid size={{ xs: 12, sm: allowed.general ? 12 : 6, lg: 2.4 }}>
              <KpiCard
                href={`${base}${Routes.Orders}`}
                icon={<ShoppingCartIcon />}
                label={t("TotalOrderAmount")}
                value={formatCurrency(data.orders.totalOrderPrice)}
                caption={t("OrdersThisYear", { count: orderCount })}
                color={theme.palette.secondary.main}
              />
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;
