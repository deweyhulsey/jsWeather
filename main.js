async function getJson(url) {
  const request = await fetch(url);
  const response = await request.json();
  return await response;
}

function getLocation() {
  return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
          (pos) => {
              return resolve(pos.coords);
          },
          (err) => {
              console.warn(`ERROR(${err.code}): ${err.message}`);
              return reject(err);
          }
      );
  });
}

async function getForecasts() { // forecast, forecastGridData, forecastHourly, forecastOffice, forecastZone
  const coords = await getLocation();
  const request = await getJson(`https://api.weather.gov/points/${coords.latitude},${coords.longitude}`);
  const forecastWeekly = await getJson(request.properties.forecast);
  const forecastHourly = await getJson(request.properties.forecastHourly);
  const forecastGridData = await getJson(request.properties.forecastGridData);
  const forecastOffice = await getJson(request.properties.forecastOffice);
  const forecastZone = await getJson(request.properties.forecastZone);
  return {coords, forecastWeekly, forecastHourly, forecastGridData, forecastOffice, forecastZone};
}

function showForecast(days) {
  return days.map(day => {
    const name = day.name;
    const num = day.number;
    const details = day.detailedForecast;
    const short = day.shortForecast;
    const timeStart = new Date(day.startTime).toLocaleString('en-US', {dateStyle: 'short', timeStyle: 'short'});
    const timeEnd = new Date(day.endTime).toLocaleString('en-US', {dateStyle: 'short', timeStyle: 'short'});
    const isDay = day.isDaytime;
    const icon = day.icon;
    const precipitation = (day.probabilityOfPrecipitation.value === null) ? 0 + '%' : day.probabilityOfPrecipitation.value + '%';
    const humidity = (day.relativeHumidity.value === null) ? 0 + '%' : day.relativeHumidity.value + '%';
    const tempF = day.temperature + 'F';
    const tempC = ((day.temperature - 32) * 5/9).toFixed(1) + 'C';
    const windDirection = day.windDirection;
    const windSpeed = day.windSpeed;
    const currentDay = (day.name.split(' '))[0].toLowerCase();
    const nameShort = (currentDay == 'this') ? 'today' : currentDay;
    const classList = nameShort + ((isDay == true) ? ' day' : ' night');
    return  `
            <div id="${num}" class="forecast ${classList}">
              <h3>${name}</h3>
              <div class="conditions">
                <div class="time">${timeStart} - ${timeEnd}</div>
                <div class="temperature">${tempF + ' / ' + tempC}</div>
                <div class="precipitation">${precipitation}</div>
                <div class="wind">${windSpeed + ' ' + windDirection}</div>
                <div class="humidity">${humidity}</div>
                <img class="icon" src="${icon}" />
              </div>
              <details>
                <summary>${short}</summary>
                <p class="details">${details}</p>
              </details>

            </div>
            `;
  }).join('');
}

async function renderPage(target) {
  const forecastData = await getForecasts();
  const forecasts = document.createElement('div');
  forecasts.setAttribute('id', 'forecasts');
  forecasts.innerHTML = showForecast(forecastData.forecastWeekly.properties.periods);
  target.innerHTML = forecasts.outerHTML;
}

window.addEventListener('load', (event) => {
  const target = document.getElementById('target');
  renderPage(target);
});