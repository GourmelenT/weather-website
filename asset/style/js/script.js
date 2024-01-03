const apiKey = "ee07e2bf337034f905cde0bdedae3db8";
const searchButton = $("#search-button");
const cityInput = $("#city-input");
const searchInput = $(".searchInput");
const weatherMainInfo = $("#weather-main-info");
const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const hamburgerIcon = $('.hamburger-icon');
const navbar_ul = $('ul');

navigator.geolocation.getCurrentPosition(async (position) => {
  if (position.coords) {
    await getWeather(null, position.coords.latitude, position.coords.longitude);
  }
}, (error) => console.log(error));

hamburgerIcon.on('click', function () {
  navbar_ul.toggleClass("menu-container");
});

searchButton.on("click", async () => {
  const city = cityInput.val();
  await getWeather(city);
});

cityInput.on("keyup", async (event) => {
  if (event.key === "Enter") {
    const city = cityInput.val();
    await getWeather(city);
  }
});

async function getWeather(city, lat, lon) {
  if (!city && lat && lon) {
    city = await getCityNameFromCoords(lat, lon);
  }
  const coords = await getCityCoords(city);
  if (coords) {
    const currentForecast = await getCurrentForecast(city);
    const hourlyForecast = await getHourlyForecast(coords.lat, coords.lon);
    const dailyForecast = await getDailyForecast(coords.lat, coords.lon);
    showWeather(currentForecast, hourlyForecast, dailyForecast);
    cityInput.val("");
  } else {
    cityInput.addClass('shake');
    searchInput.css('color', 'red');
    setTimeout(() => {
      cityInput.removeClass('shake');
      searchInput.css('color', 'white');
      cityInput.val("");
    }, 300)
  }
}

async function getCityCoords(cityName) {
  const res = await $.ajax({
    url: `http://api.openweathermap.org/geo/1.0/direct?q=${cityName}&appid=${apiKey}`,
    type: 'GET',
    dataType: 'json',
  })
  if (res.length > 0) {
    return {
      lat: res[0].lat,
      lon: res[0].lon
    };
  }
}

async function getCityNameFromCoords(lat, lon) {
  const res = await $.ajax({
    url: `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&appid=${apiKey}`,
    type: 'GET',
    dataType: 'json',
  });
  if (res) {
    return res[0].name;
  }
  return res;
}

async function getCurrentForecast(cityName) {
  const forecast = await $.ajax({
    url: `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}&lang=fr`,
    type: 'GET',
    dataType: 'json',
  })
  return forecast;
}

async function getHourlyForecast(lat, lon) {
  const forecast = await $.ajax({
    url: `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&cnt=7&appid=${apiKey}&lang=fr`,
    type: 'GET',
    dataType: 'json',
  })
  return forecast;
}

async function getDailyForecast(lat, lon) {
  const forecast = await $.ajax({
    url: `https://api.openweathermap.org/data/2.5/forecast/daily?lat=${lat}&lon=${lon}&cnt=8&appid=${apiKey}&lang=fr`,
    type: 'GET',
    dataType: 'json',
  })
  return forecast;
}

function capitalizeWeatherDescription(description) {
  return description.charAt(0).toUpperCase() + description.slice(1);
}

function mSToKmH(metersPerSecond) {
  return Math.round(metersPerSecond * 3.6);
}

function showWeather(currentForecast, hourlyForecast, dailyForecast) {
  const weatherDescription = currentForecast.weather[0].description;
  const temperature = Math.round(currentForecast.main.temp - 273.15);
  const humidity = currentForecast.main.humidity;
  const windDeg = currentForecast.wind.deg;
  const windSpeed = mSToKmH(currentForecast.wind.speed);
  const capitalizedDescription = capitalizeWeatherDescription(weatherDescription);

  let hourlyForecastDivs = "";
  for (const forecast of hourlyForecast.list) {
    const hour = forecast.dt_txt.split(' ')[1].substring(0, 5);
    const iconId = forecast.weather[0].id;
    const temp = Math.round(forecast.main.temp - 273.15);
    const day = daysOfWeek[new Date(forecast.dt_txt).getDay()]
      + ' '
      + new Date(forecast.dt_txt).getDate()
      + "\n"
      + capitalizeWeatherDescription(forecast.weather[0].description);
    hourlyForecastDivs = hourlyForecastDivs + `<div class="weather-hourly-forecast-frame" title="${day}"> <p class="weather-hourly-forecast-hour">${hour}</p> <span class="wi wi-owm-${iconId}"></span> <p class="weather-hourly-forecast-temperature">${temp}°C</p> </div>`;
  }

  let dailyForecastDivs = "";
  let first = true;
  for (const forecast of dailyForecast.list) {
    if (!first) {
      const date = new Date(forecast.dt * 1000);
      const day = daysOfWeek[date.getDay()];
      const iconId = forecast.weather[0].id;
      const temp = Math.round(forecast.temp.day - 273.15);
      const title = day
        + ' '
        + date.getDate()
        + "\n"
        + capitalizeWeatherDescription(forecast.weather[0].description);
      dailyForecastDivs = dailyForecastDivs + `<div class="weather-daily-forecast-frame" title="${title}"> <p class="weather-daily-forecast-day">${day.substring(0, 3)}.</p> <span class="wi wi-owm-${iconId}"></span> <p class="weather-daily-forecast-temperature">${temp}°C</p> </div>`
    } else {
      first = false;
    }
  }

  weatherMainInfo.html(`

  <h2 title="Météo à ${currentForecast.name}">${currentForecast.name}</h2>
  <div class="weather-city-main-info-div">
    <div class="weather-city-main-info-left">
      <p class="weather-main-temperature" title="Température">${temperature}°C</p>
      <p title="Météo">${capitalizedDescription}</p>
    </div>
    <div class="weather-city-main-info-right">
      <span class="wi wi-owm-${currentForecast.weather[0].id}" title="Météo"></span>
    </div>
  </div>
  <div class="weather-city-sun-container">
    <div class="weather-city-sun weather-sunrise" title="Lever de soleil">
      <div>
      <span class="wi wi-sunrise"></span></div>
      ${new Date(currentForecast.sys.sunrise * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
    </div>
    <div class
="weather-city-sun weather-sunset" title="Coucher de soleil">
<span class="wi wi-sunset"></span>
${new Date(currentForecast.sys.sunset * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
</div>

  </div>
  <div class="weather-infos">
    <div class="weather-additional-info temperature-container" title="Température ressentie">
      <span class="wi wi-thermometer"></span>
      <p class="weather-additional-info-p">${Math.round(currentForecast.main.feels_like - 273.15)}°C</p>
    </div>
    <div class="separator"></div>
    <div class="weather-additional-info humidity-pression-container" title="Humidité">
      <span class="wi wi-humidity"></span>
      <p class="weather-additional-info-p">${humidity}%</p>
    </div>
    <div class="separator"></div>
    <div class="weather-additional-info wind-container" title="Vent">
      <span class="wi wi-wind towards-${(windDeg + 180) % 360}-deg"></span>
      <p class="weather-additional-info-p">${windSpeed} km/h</p>
    </div>
  </div>
  <div class="weather-hourly-forecast-container" id="hourlyContainer" title="Prévisions horaires">
    <i class="material-icons vertical-icon">remove</i>
    <i class="material-icons horizontal-icon">remove</i>
    <h3 class="weather-hourly-forecast-items">Prévisions horaires</h2>
    <div class="weather-hourly-forecast-items">
      <div class="title-container" title="Prévisions horaires"></div>
      ${hourlyForecastDivs}
    </div>
  </div>
  <div class="weather-daily-forecast-container" id="dailyContainer" title="Prévisions des prochains jours">
    <i class="material-icons vertical-icon">remove</i>
    <i class="material-icons horizontal-icon">remove</i>
    <h3 class="weather-daily-forecast-items">Prévisions des prochains jours</h2>
    <div class="weather-daily-forecast-items">
      <div class="title-container" title="Prévisions des prochains jours"></div>
      ${dailyForecastDivs}
    </div>
  </div>
  `);
  const hourlyContainer = $("#hourlyContainer");
  hourlyContainer.click(async () => {
    hourlyContainer.toggleClass("container-active");
  });

  const dailyContainer = $("#dailyContainer");
  dailyContainer.click(async () => {
    dailyContainer.toggleClass("container-active");
  });
}