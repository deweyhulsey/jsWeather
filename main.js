async function getJson(url) {
  const request = await fetch(url);
  const response = await request.json();
  return await response;
}

function localeTime(time) {
  return new Date(time).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})
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

function showForecast(days, hourlyForecast) {
  return days.map(day => {
    const name = day.name;
    const num = day.number;
    const details = day.detailedForecast;
    const short = day.shortForecast;
    const timeStart = localeTime(day.startTime);
    const timeEnd = localeTime(day.endTime);
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
    const hourly = getHourly(day.startTime, day.endTime, hourlyForecast);
    // console.log(hourly);
    return  `
          <div class="forecast-container">
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
            <div id="${num}" class="forecast hourly ${classList}">
            `+ showHourly(hourly) +`
            </div>
          </div>
            `;
  }).join('');
}

function showHourly(hourly) {
  return hourly.map(hour => {
    const timeStart = new Date(hour.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const timeEnd = new Date(hour.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const shortForecast = hour.shortForecast;
    const temp = hour.temperature + 'F';
    return  `
            <div class="hour">
              <h3>${temp}</h3>
              <small>${timeStart}</small>
            </div>
            `;
  }).join('');
}

function getHourly(dayStartTime, dayEndTime, hourly) {
  let hourlyForecasts = [];
  let startingHour = null;
  hourly.forEach(hour => {
    if(hour.startTime === dayStartTime) {
      startingHour = hour.number;
      hourlyForecasts.push(hour);
    }
    if(startingHour !== null && hour.number > startingHour && hour.number <= startingHour + 11  && hour.startTime !== dayEndTime) {
      hourlyForecasts.push(hour);
    } else if(hour.startTime == dayEndTime) {
      startingHour = null;
    }
  });
 return hourlyForecasts;
}

async function renderPage(target) {
  const forecastData = await getForecasts();
  const forecasts = document.createElement('div');
  forecasts.setAttribute('id', 'forecasts');
  forecasts.innerHTML = showForecast(forecastData.forecastWeekly.properties.periods, forecastData.forecastHourly.properties.periods);
  target.innerHTML = forecasts.outerHTML;
}

window.addEventListener('load', (event) => {
  const target = document.getElementById('target');
  const button = document.getElementById('getWeather');
  button.addEventListener('click', (event) => {
    renderPage(target);
  });
});

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  // e.preventDefault();
  // Stash the event so it can be triggered later.
  // deferredPrompt = e;
  // Update UI notify the user they can install the PWA
  // showInstallPromotion();
  // Optionally, send analytics event that PWA install promo was shown.
  console.log(`'beforeinstallprompt' event was fired.`);
});