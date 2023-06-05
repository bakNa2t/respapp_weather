import { setLocationObject,
         getHomeLocation,
         getWeatherFromCoords,
         getCoordsFromApi,
         cleanText }
from "./dataFunctions.js";

import { 
    setPlaceholderText,
    addSpinner,
    displayError,
    displayApiError,
    updateScreenReaderConfirmation,
    updateDisplay
} from "./domFunctions.js";

import CurrentLocation from "./currentLocation.js";

const currentLoc = new CurrentLocation();

const initApp = () => {
//---------------------add listeners-------------------

//------------------geolocation button------------------
const geoButton = document.getElementById("getLocation");
geoButton.addEventListener("click", getGeoWeather);
//----------------------home button---------------------
const homeButton = document.getElementById("home");
homeButton.addEventListener("click", loadWeather);
//------------------savelocation button-----------------
const saveButton = document.getElementById("saveLocation");
saveButton.addEventListener("click", saveLocation);
//-----------------------unit button--------------------
const unitButton = document.getElementById("unit");
unitButton.addEventListener("click", setUnitPref);
//-----------------------refresh button-------------------
const refreshButton = document.getElementById("refresh");
refreshButton.addEventListener("click", refreshWeather);
//------------------------searh button----------------------
const locationEntry = document.getElementById("searchBar__form");
locationEntry.addEventListener("submit", submitNewLocation);
    //set up
setPlaceholderText();
    //load weather
loadWeather();
}

document.addEventListener("DOMContentLoaded", initApp);

// ----------Получить геолакацию ----------------------
const getGeoWeather = (event) => {
    if (event && event.type  === "click") {
            //add spinner
            const mapIcon = document.querySelector(".fa-map-marker-alt");
            addSpinner(mapIcon);           
        }
    if (!navigator.geolocation) return geoError();
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError);
};

// ----------Получить ошибку местоположения-------------
const geoError = (errObj) => {
    const errMsg = errObj.message ? errObj.message : "Geolocation not supported";
    // const errMsg = errObj ? errObj.message : "Geolocation not supported"
    displayError(errMsg, errMsg);
};

// --------- Получить местоположение-------------------
const geoSuccess = (position) => {
    const myCoordsObj = {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        name: `Lat:${position.coords.latitude} Long:${position.coords.longitude}`
    };
    // set location object
    setLocationObject(currentLoc, myCoordsObj);
    console.log(currentLoc);

    // update data and diaplay
    updateDataAndDisplay(currentLoc);
};

//--------Home Button Load Weather----------------
const loadWeather = (event) => {
    const savedLocation = getHomeLocation;
    if (!savedLocation && !event) return getGeoWeather();
    if (!savedLocation && event.type === "click") {
        displayError(
            "No home location Saved.",
            "Sorry. Please save your home location first."
        );
    } else if (savedLocation && !event) {
        displayHomeLocationWeather(savedLocation);
    } else {
        const homeIcon = document.querySelector(".fa-home");
        addSpinner(homeIcon);
        displayHomeLocationWeather(savedLocation);
    }
};

// -----------------------------------------------
const displayHomeLocationWeather = (home) => {
    if (typeof home === "string") {
        const locationJson = JSON.parse(home);
        const myCoordsObj = {
            lat: locationJson.lat,
            lon: locationJson.lon,
            name: locationJson.name,
            unit: locationJson.unit
        };
        setLocationObject(currentLoc, myCoordsObj);
        updateDataAndDisplay(currentLoc);
    }
};

// --------Save location button------------------
const saveLocation = () => {
    if (currentLoc.getLat() && currentLoc.getLon()) {
        const saveIcon = document.querySelector(".fa-save");
        addSpinner(saveIcon);
        const location = {
            name: currentLoc.getName(),
            lat: currentLoc.getLat(),
            lon: currentLoc.getLon(),
            unit: currentLoc.getUnit()
        };
        localStorage.setItem("defaultWeatherLocation", JSON.stringify(location));
        updateScreenReaderConfirmation(
            `Saved ${currentLoc.getName()} as home location.`
        );
    }
};

// ----------Unit button---------------
const setUnitPref = () => {
    const unitIcon = document.querySelector(".fa-chart-bar");
    addSpinner(unitIcon);
    currentLoc.toggleUnit();
    updateDataAndDisplay(currentLoc);
};

//----------Refresh button-------------
const refreshWeather = () => {
    const refreshIcon = document.querySelector(".fa-sync-alt");
    addSpinner(refreshIcon);
    updateDataAndDisplay(currentLoc);
};

//-------Search button----------------
const submitNewLocation = async (event) => {
    event.preventDefault();
    const text = document.getElementById("searchBar__text").value;
    const entryText = cleanText(text);
    if (!entryText.length) return;
    const locationIcon = document.querySelector(".fa-search");
    addSpinner(locationIcon);
    const coordsData = await getCoordsFromApi(entryText, currentLoc.getUnit());
    if (coordsData) {
        if (coordsData.cod === 200) {
            //work with api data
            //get success
            const myCoordsObj = {
                lat: coordsData.coord.lat,
                lon: coordsData.coord.lon,
                name: coordsData.sys.country
                ? `${coordsData.name} ${coordsData.sys.country}`
                : coordsData.name  
            };
            setLocationObject(currentLoc, myCoordsObj);
            updateDataAndDisplay(currentLoc);
        } else {
            displayApiError(coordsData);
        }
    } else {
        displayError ("Connection error", "Connection error");
    }
};


const updateDataAndDisplay = async (locationObj) => {
    const weatherJson = await getWeatherFromCoords(locationObj);
    // console.log(weatherJson);
    if (weatherJson) updateDisplay(weatherJson, locationObj);
};