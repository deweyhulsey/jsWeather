import { toDateTime, toTime, toDate, toTemp } from './helpers.js';

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
  // const forecastGridData = await getJson(request.properties.forecastGridData);
  // const forecastOffice = await getJson(request.properties.forecastOffice);
  // const forecastZone = await getJson(request.properties.forecastZone);
  // return {coords, forecastWeekly, forecastHourly, forecastGridData, forecastOffice, forecastZone};
  return { forecastWeekly, forecastHourly }
}

function showForecast(days, hourlyForecast) {
  return days.map(day => {
    const name = day.name;
    const num = day.number;
    const details = day.detailedForecast;
    const short = day.shortForecast;
    const date = toDate(day.startTime);
    const timeStart = toTime(day.startTime);
    const timeEnd = toTime(day.endTime);
    const isDay = day.isDaytime;
    const icon = day.icon;
    const precipitation = (day.probabilityOfPrecipitation.value === null) ? 0 + '%' : day.probabilityOfPrecipitation.value + '%';
    const humidity = (day.relativeHumidity.value === null) ? 0 + '%' : day.relativeHumidity.value + '%';
    const temp = toTemp(day.temperature);
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
              <div class="title">${name}</div>
              <div class="date">${date}<br />${timeStart} to ${timeEnd}</div>
              <div class="conditions">
                <div class="temperature">${temp.f + ' / ' + temp.c}</div>
                <div class="precipitation">${precipitation}</div>
                <div class="wind">${windSpeed + ' ' + windDirection}</div>
                <div class="humidity">${humidity}</div>
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
    const timeStart = toTime(hour.startTime);
    const timeEnd = toTime(hour.endTime);
    const shortForecast = hour.shortForecast;
    const temp = toTemp(hour.temperature);
    return  `
            <div class="hour">
              <h4>${temp.f} / ${temp.c}</h4>
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