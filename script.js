// Check if the script is running in a browser environment
if (typeof window !== 'undefined') {
    const cityInput = document.querySelector(".city-input");
    const searchButton = document.querySelector(".search-btn");
    const locationButton = document.querySelector(".location-btn");
    const currentWeatherDiv = document.querySelector(".current-weather");
    const weatherCardsDiv = document.querySelector(".weather-cards");
    const toggleSwitch = document.getElementById("toggleTemperature");
    let currentWeatherData = null;
    let currentUnit = "F"; // Initialize temperature unit to Fahrenheit

    const API_KEY = "6b75e1f27bd464fbc659aabb6312388f"; // OpenWeatherMap API key

    const createWeatherCard = (cityName, weatherItem, index) => {
        const temperature = currentUnit === "C" ?
            (weatherItem.main.temp - 273.15).toFixed(2) :
            ((weatherItem.main.temp - 273.15) * 9/5 + 32).toFixed(2);

        const windSpeed = currentUnit === "C" ?
            (weatherItem.wind.speed * 3.6).toFixed(2) :
            (weatherItem.wind.speed * 2.2369).toFixed(2);

        const forecastDate = new Date(weatherItem.dt_txt).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });

        if (index === 0) { //Creates weather card for today's weather
            return " ";
        } else { //Creates weather cards for the remaining 7 days
            return `<li class="card">
            	<h3>${forecastDate}</h3>
            	<img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@2x.png" alt="weather-icon">
            	<h4 class="temp-label" data-type="high-low">Temp: ${temperature}°${currentUnit}</h4>
            	<h4>Wind: ${windSpeed} ${currentUnit === "C" ? "km/h" : "mph"}</h4>
            	<h4>Humidity: ${weatherItem.main.humidity}%</h4>
        	</li>`;
        }
    }

    const getWeatherDetails = (cityName, lat, lon) => {
        const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

        return new Promise((resolve, reject) => {
            fetch(WEATHER_API_URL)
                .then(res => res.json())
                .then(data => {
                    currentWeatherData = data;
                    const uniqueForecastDays = [];

                    const sevenDaysForecast = data.list.filter(forecast => {
                        const forecastDate = new Date(forecast.dt_txt).getDate();
                        if (!uniqueForecastDays.includes(forecastDate)) {
                            return uniqueForecastDays.push(forecastDate);
                        }
                    });

                    // Clears old data
                    cityInput.value = "";
                    weatherCardsDiv.innerHTML = "";

                    sevenDaysForecast.forEach((weatherItem, index) => {
                        weatherCardsDiv.insertAdjacentHTML("beforeend", createWeatherCard(cityName, weatherItem, index));
                    });

                    resolve(); // Resolve the promise when data is fetched
                })
                .catch(error => {
                    reject(error); // Reject the promise if there's an error
                });
        });
    }

    const updateTemperatureLabels = () => {
        const temperatureLabels = document.querySelectorAll(".temp-label");

        temperatureLabels.forEach(label => {
            const currentTemperature = parseFloat(label.textContent.match(/\d+(\.\d+)?/)[0]);
            const newTemperature = currentUnit === "C" ?
                ((currentTemperature - 32) * 5/9).toFixed(2) :
                ((currentTemperature * 9/5) + 32).toFixed(2);

            label.textContent = label.textContent.replace(/\d+(\.\d+)?°[CF]/, `${newTemperature}°${currentUnit}`);
        });
    };

    const getCityCoordinates = () => {
        const cityName = cityInput.value.trim(); // deletes trailing spaces after user input
        if (!cityName) return;
        const GEOCODING_API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;

        fetch(GEOCODING_API_URL)
            .then(res => res.json())
            .then(data => {
                if (!data.length) return alert(`No coordinates found for ${cityName}`);
                const { name, lat, lon } = data[0];

                document.getElementById('cityName').textContent = name;
                getWeatherDetails(name, lat, lon)
                    .then(() => {
                        const currentDate = currentWeatherData.list[0].dt_txt.split(" ")[0];
                        document.getElementById('currentDate').textContent = currentDate;
                        setCurrentWeatherCard();
                    })
                    .catch(error => {
                        alert(`An error occurred while fetching the weather details: ${error.message}`);
                    });
            })
            .catch(() => {
                alert("An error occurred while fetching the coordinates!");
            });
    }

    const setCurrentWeatherCard = () => {
    	const weatherItem = currentWeatherData.list[0]; // Get the current weather item

    	// Check if the current weather item is available
    	if (weatherItem) {
        	const bottomBlock = document.querySelector(".bottom-block");

        	const temperatureInCelsius = (weatherItem.main.temp - 273.15).toFixed(2);
        	const temperatureInFahrenheit = ((weatherItem.main.temp - 273.15) * 9/5 + 32).toFixed(2);
        	const currentTemperature = currentUnit === "C" ? temperatureInCelsius : temperatureInFahrenheit;

        	const currentDate = new Date(weatherItem.dt_txt).toLocaleDateString(undefined, {
            	weekday: 'short',
            	month: 'short',
            	day: 'numeric'
        	});

        	// Update the HTML content of the bottom block
        	bottomBlock.innerHTML = `
            	<div class="bottom-details">
                	<h4>Temperature: ${currentTemperature}°${currentUnit}</h4>
                	<h4>Wind: ${weatherItem.wind.speed} ${currentUnit === "C" ? "mph" : "mph"}</h4>
                	<h4>Humidity: ${weatherItem.main.humidity}%</h4>
            	</div>
            	<div class="icon">
                	<img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                	<h4>${weatherItem.weather[0].description}</h4>
            	</div>
        	`;
        
        	document.getElementById('currentDate').textContent = currentDate;
    	}
	};


    const getLocalCoordinates = () => {
        navigator.geolocation.getCurrentPosition(
            position => {
                // Pulls user location and searches for city
                const { latitude, longitude } = position.coords;
                const REVERSE_GEOCODING_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;

                fetch(REVERSE_GEOCODING_URL)
                    .then(res => res.json())
                    .then(data => {
                        const { name } = data[0];
                        getWeatherDetails(name, latitude, longitude);
                    })
                    .catch(() => {
                        alert("An error occurred while fetching the city!");
                    });
            },
            error => {
                if (error.code === error.PERMISSION_DENIED) {
                    alert("Permission was denied. Please reset location permissions and retry.");
                }
            }
        );
    }

    toggleSwitch.addEventListener("change", () => {
        currentUnit = toggleSwitch.checked ? "C" : "F";
        updateTemperatureLabels();
        setCurrentWeatherCard(); // Update the current weather card when the switch changes
    });

    locationButton.addEventListener("click", getLocalCoordinates);
    searchButton.addEventListener("click", getCityCoordinates);
    cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

} 
else {
    // Code for the Node.js environment
    console.log("This code is running in a Node.js environment.");

    // Exported functions from the second script
    module.exports = {
        createWeatherCard,
        getWeatherDetails,
        getCityCoordinates,
        API_KEY: "6b75e1f27bd464fbc659aabb6312388f", // Export API_KEY for testing in Node.js
    };
}
