const daySelect = document.getElementById("daySelect");
const resortList = document.getElementById("resortList");
const showGraphBtn = document.getElementById("showGraphBtn");
const today = new Date();

/**
 * Resort data and cached forecasts
 * Key: resort name
 * Value: { snowfall: array of snowfall values, temperature: array of temperature values, windSpeed: array of wind speed values }
 */
const resortForecasts = {};

function getNext7Days() {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push(d.toDateString());
  }
  return days;
}

// Populate dropdown for single-day list
for (let i = 0; i < 7; i++) {
  const d = new Date(today);
  d.setDate(today.getDate() + i);
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = d.toDateString();
  daySelect.appendChild(opt);
}

async function fetchForecast(resort) {
  try {
    const pointResp = await fetch(
      `https://api.weather.gov/points/${resort.lat},${resort.lon}`
    );
    const pointData = await pointResp.json();
    const { gridId, gridX, gridY } = pointData.properties;

    const gridResp = await fetch(
      `https://api.weather.gov/gridpoints/${gridId}/${gridX},${gridY}`
    );
    const gridData = await gridResp.json();

    // Store multiple types of forecast data
    resortForecasts[resort.name] = {
      snowfall: gridData.properties.snowfallAmount.values || [],
      temperature: gridData.properties.temperature.values || [],
      windSpeed: gridData.properties.windSpeed.values || [],
    };
  } catch (e) {
    console.error(`Error fetching forecast for ${resort.name}`, e);
    resortForecasts[resort.name] = {
      snowfall: [],
      temperature: [],
      windSpeed: [],
    };
  }
}

// Render single-day list using cached forecast
function renderList() {
  resortList.innerHTML = "";
  const dayOffset = daySelect.value;
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + Number(dayOffset));

  for (const resort of resorts) {
    const li = document.createElement("li");
    li.textContent = `${resort.name} (${resort.state}) – loading…`;
    resortList.appendChild(li);

    const forecast = resortForecasts[resort.name];
    if (!forecast || forecast.snowfall.length === 0) {
      li.textContent = `${resort.name} (${resort.state}) – unavailable`;
      continue;
    }

    // Snowfall
    let totalSnow = 0;
    forecast.snowfall.forEach((entry) => {
      const entryDate = new Date(entry.validTime.split("/")[0]);
      if (
        entryDate.toDateString() === targetDate.toDateString() &&
        typeof entry.value === "number"
      ) {
        totalSnow += entry.value;
      }
    });

    // Temperature (average for the day)
    let temps = forecast.temperature
      .filter(
        (entry) =>
          new Date(entry.validTime.split("/")[0]).toDateString() ===
          targetDate.toDateString()
      )
      .map((entry) => entry.value);
    let avgTemp = temps.length
      ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
      : "N/A";

    // Wind (max for the day)
    let winds = forecast.windSpeed
      .filter(
        (entry) =>
          new Date(entry.validTime.split("/")[0]).toDateString() ===
          targetDate.toDateString()
      )
      .map((entry) => entry.value);
    let maxWind = winds.length ? Math.max(...winds).toFixed(1) : "N/A";

    const feet = totalSnow / 12;
    li.innerHTML = `
      ${resort.name} (${resort.state}): 
      <span class="snow">${feet.toFixed(2)} ft</span>, 
      Temp: <span class="temp">${avgTemp} °F</span>, 
      Wind: <span class="wind">${maxWind} mph</span>
    `;
  }
}

// Preload all forecasts, then render list
async function init() {
  const fetches = resorts.map((resort) => fetchForecast(resort));
  await Promise.all(fetches);

  renderList();
}

daySelect.addEventListener("change", renderList);

// Start
init();
