const sections = {
  Finances: ["Bills", "Revenue", "ROI", "Growth"],
  Admin: ["Users", "Roles", "Approvals", "Audit Logs"],
  Sales: ["Pipeline", "Forecast", "Targets", "Commissions"],
  Marketing: ["Campaigns", "Leads", "Attribution", "Spend"],
  Operations: ["Inventory", "Suppliers", "Fulfillment", "SLA"],
};

let activeSection = "Finances";
let activeSubtab = "Growth";

const dataset = [
  { month: "Jan", channel: "Paid Ads", region: "North America", revenue: 42000, customers: 480 },
  { month: "Jan", channel: "Organic", region: "Europe", revenue: 32000, customers: 430 },
  { month: "Jan", channel: "Email", region: "Asia", revenue: 19000, customers: 250 },
  { month: "Feb", channel: "Paid Ads", region: "North America", revenue: 46000, customers: 520 },
  { month: "Feb", channel: "Organic", region: "Europe", revenue: 34000, customers: 450 },
  { month: "Feb", channel: "Email", region: "Asia", revenue: 22000, customers: 270 },
  { month: "Mar", channel: "Paid Ads", region: "North America", revenue: 51000, customers: 550 },
  { month: "Mar", channel: "Organic", region: "Europe", revenue: 36000, customers: 465 },
  { month: "Mar", channel: "Email", region: "Asia", revenue: 24000, customers: 290 },
  { month: "Apr", channel: "Paid Ads", region: "North America", revenue: 54000, customers: 580 },
  { month: "Apr", channel: "Organic", region: "Europe", revenue: 38500, customers: 480 },
  { month: "Apr", channel: "Email", region: "Asia", revenue: 25500, customers: 310 },
  { month: "May", channel: "Paid Ads", region: "North America", revenue: 56000, customers: 610 },
  { month: "May", channel: "Organic", region: "Europe", revenue: 41200, customers: 510 },
  { month: "May", channel: "Email", region: "Asia", revenue: 27000, customers: 330 },
  { month: "Jun", channel: "Paid Ads", region: "North America", revenue: 60000, customers: 655 },
  { month: "Jun", channel: "Organic", region: "Europe", revenue: 43000, customers: 530 },
  { month: "Jun", channel: "Email", region: "Asia", revenue: 29000, customers: 355 },
];

const selectedChannels = new Set();

const fmtCurrency = (value) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

const fmtNumber = (value) => new Intl.NumberFormat("en-US").format(value);

const getFiltered = () =>
  selectedChannels.size ? dataset.filter((row) => selectedChannels.has(row.channel)) : dataset;

const aggregate = (rows, field, groupBy) =>
  Object.values(
    rows.reduce((acc, row) => {
      const key = row[groupBy];
      acc[key] ??= { key, value: 0 };
      acc[key].value += row[field];
      return acc;
    }, {}),
  );

function renderSectionMenus() {
  const topTabs = document.getElementById("topTabs");
  topTabs.innerHTML = Object.keys(sections)
    .map(
      (name) =>
        `<button class="tab-button ${name === activeSection ? "active" : ""}" data-section="${name}">${name}</button>`,
    )
    .join("");

  topTabs.querySelectorAll(".tab-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSection = btn.dataset.section;
      activeSubtab = sections[activeSection][0];
      selectedChannels.clear();
      render();
    });
  });

  const sideSubtabs = document.getElementById("sideSubtabs");
  sideSubtabs.innerHTML = sections[activeSection]
    .map(
      (sub) =>
        `<li><button class="subtab-button ${sub === activeSubtab ? "active" : ""}" data-subtab="${sub}">${sub}</button></li>`,
    )
    .join("");

  sideSubtabs.querySelectorAll(".subtab-button").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeSubtab = btn.dataset.subtab;
      renderHeader();
      renderSectionMenus();
    });
  });
}

function renderHeader() {
  document.getElementById("breadcrumb").textContent = `${activeSection} / ${activeSubtab}`;
  document.getElementById("dashboardTitle").textContent = `${activeSubtab} Analytics Dashboard`;
}

function drawKPIs(rows) {
  const revenue = rows.reduce((sum, row) => sum + row.revenue, 0);
  const customers = rows.reduce((sum, row) => sum + row.customers, 0);
  const conversion = customers ? (customers / 9800) * 100 : 0;
  const aov = customers ? revenue / customers : 0;

  document.getElementById("kpiRevenue").textContent = fmtCurrency(revenue);
  document.getElementById("kpiCustomers").textContent = fmtNumber(customers);
  document.getElementById("kpiConversion").textContent = `${conversion.toFixed(1)}%`;
  document.getElementById("kpiAov").textContent = fmtCurrency(aov);
}

function drawTrend(rows) {
  const monthly = aggregate(rows, "revenue", "month");
  const order = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  monthly.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  const svg = document.getElementById("trendChart");
  const width = 860;
  const height = 320;
  const padding = 40;
  const maxY = Math.max(...monthly.map((m) => m.value), 1);

  const points = monthly
    .map((item, index) => {
      const x = padding + (index * (width - padding * 2)) / (monthly.length - 1 || 1);
      const y = height - padding - (item.value / maxY) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  svg.innerHTML = `
    <polyline points="${points}" fill="none" stroke="#3d6df2" stroke-width="4" stroke-linecap="round" />
    ${monthly
      .map((item, i) => {
        const x = padding + (i * (width - padding * 2)) / (monthly.length - 1 || 1);
        const y = height - padding - (item.value / maxY) * (height - padding * 2);
        return `
          <circle cx="${x}" cy="${y}" r="5" fill="#16a085" />
          <text x="${x}" y="${height - 12}" fill="#5f6f8f" font-size="12" text-anchor="middle">${item.key}</text>
        `;
      })
      .join("")}
  `;
}

function drawChannelBars(rows) {
  const channels = aggregate(rows, "revenue", "channel").sort((a, b) => b.value - a.value);
  const max = Math.max(...channels.map((c) => c.value), 1);
  const container = document.getElementById("channelBars");

  container.innerHTML = channels
    .map((channel) => {
      const active = selectedChannels.has(channel.key);
      return `
        <div class="channel-row">
          <div class="channel-label"><span>${channel.key}</span><span>${fmtCurrency(channel.value)}</span></div>
          <div class="bar-track ${active ? "active" : ""}" data-channel="${channel.key}">
            <div class="bar-fill" style="width:${(channel.value / max) * 100}%"></div>
          </div>
        </div>
      `;
    })
    .join("");

  container.querySelectorAll(".bar-track").forEach((bar) => {
    bar.addEventListener("click", () => {
      const { channel } = bar.dataset;
      if (selectedChannels.has(channel)) {
        selectedChannels.delete(channel);
      } else {
        selectedChannels.add(channel);
      }
      render();
    });
  });
}

function drawRegionMix(rows) {
  const regions = aggregate(rows, "revenue", "region").sort((a, b) => b.value - a.value);
  const total = regions.reduce((sum, r) => sum + r.value, 0) || 1;

  document.getElementById("regionList").innerHTML = regions
    .map(
      (region) =>
        `<li><span>${region.key}</span><strong>${((region.value / total) * 100).toFixed(1)}%</strong></li>`,
    )
    .join("");
}

function renderFilterLabel() {
  const label = document.getElementById("activeFilterLabel");
  if (!selectedChannels.size) {
    label.textContent = "All channels selected";
    return;
  }
  label.textContent = `${selectedChannels.size} channel(s): ${[...selectedChannels].join(", ")}`;
}

function render() {
  const rows = getFiltered();
  renderHeader();
  renderSectionMenus();
  drawKPIs(rows);
  drawTrend(rows);
  drawChannelBars(dataset);
  drawRegionMix(rows);
  renderFilterLabel();
}

document.getElementById("resetFilters").addEventListener("click", () => {
  selectedChannels.clear();
  render();
});

document.getElementById("exportData").addEventListener("click", () => {
  const rows = getFiltered();
  const csv = ["month,channel,region,revenue,customers", ...rows.map((r) => `${r.month},${r.channel},${r.region},${r.revenue},${r.customers}`)].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "growth-analytics-export.csv";
  link.click();
  URL.revokeObjectURL(link.href);
});

render();
