// graph.js
// containerId defaults to "snowfallChart"
async function renderGraph(
  resorts,
  resortForecasts,
  containerId = "snowfallChart"
) {
  const labels = getNext7Days();
  const traces = [];

  for (const resort of resorts) {
    const forecast = resortForecasts[resort.name];
    const snowData = labels.map((day) => {
      let total = 0;
      forecast.snowfall.forEach((entry) => {
        const entryDate = new Date(entry.validTime.split("/")[0]);
        if (
          entryDate.toDateString() === day &&
          typeof entry.value === "number"
        ) {
          total += entry.value;
        }
      });
      return total / 12; // inches → feet
    });

    traces.push({
      x: labels,
      y: snowData,
      mode: "lines+markers",
      name: resort.name,
      hovertemplate: "%{text}<br>%{x}: %{y:.2f} ft<extra></extra>",
      text: Array(labels.length).fill(resort.name),
    });
  }

  const layout = {
    title: "7-Day Forecast Snowfall (ft) per Resort",
    xaxis: { title: "Date" },
    yaxis: { title: "Snowfall (ft)", rangemode: "tozero" },
    showlegend: true,
    margin: { t: 50, r: 50, l: 50, b: 100 },
  };

  Plotly.newPlot(containerId, traces, layout, {
    responsive: true,
    displayModeBar: false,
  });
}

let graphVisible = false; // track state
showGraphBtn.addEventListener("click", async () => {
  const chartDiv = document.getElementById("snowfallChart");

  if (!graphVisible) {
    // First time or currently hidden → render graph
    await renderGraph(resorts, resortForecasts);
    chartDiv.style.display = "block";
    showGraphBtn.textContent = "Hide 7-Day Graph";
    graphVisible = true;
  } else {
    // Currently visible → hide graph
    chartDiv.style.display = "none";
    showGraphBtn.textContent = "Show 7-Day Graph";
    graphVisible = false;
  }
});
