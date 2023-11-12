/*******************************/
/******** Configuration ********/
/*******************************/
var bridgeIP = "" // Hue bridge IP adress
var username = "" // See https://developers.meethue.com/develop/get-started-2/ to generate a username
var updateFrequency = -1 // How often the page is refreshed (in seconds)
// 2D array : config_Groups[Group][Light] with config_Groups[Group][0] the name of the group
var config_Groups = [["Room 1", 1, 2]["Room 2", 3, 9]]


// Global variables
var lightOn = "#1b9019"
var lightOff = "#901919"
var bConfigurationChecked = false;


function ToggleState(lightID) {
	var etat = document.getElementById(lightID).children["OnOffButton"].value;
	if(etat == "Allumer")
	{
		var brightness = document.getElementById(lightID).children["Sliders"].children["BrightnessLabel"].children["Brightness"].value;
		var colorTemp = document.getElementById(lightID).children["Sliders"].children["ColorTempLabel"].children["ColorTemp"].value;
		TurnOnLight(lightID, brightness, colorTemp);
	}
	else
	{
		TurnOffLight(lightID);
	}
}

function ToggleStates(groupID) {
	var button = document.getElementById(groupID).children["groupHeader"].children["GroupOnOffButton"];
	var etat = button.value;
	var lights = document.getElementById(groupID).children["lights"];
	if(etat === "Tout allumer") {
		for(nIndex = 0; nIndex < lights.children.length; nIndex++) {
			var light = document.getElementById(groupID).children["lights"].children[nIndex];
			var brightness = light.children["Sliders"].children["BrightnessLabel"].children["Brightness"].value;
			var colorTemp = light.children["Sliders"].children["ColorTempLabel"].children["ColorTemp"].value;
			TurnOnLight(light.id, brightness, colorTemp);
		}
		button.value = "Tout éteindre";
		button.style.backgroundColor = lightOn;
	}
	else {
		for(nIndex = 0; nIndex < lights.children.length; nIndex++) {
			TurnOffLight(document.getElementById(groupID).children["lights"].children[nIndex].id);
		}
		button.value = "Tout allumer";
		button.style.backgroundColor = lightOff;
	}
}

function TurnOnLight(lightID, brightness, colorTemp)
{
	fetch("http://" + bridgeIP + "/api/" + username + "/lights/" + lightID + "/state", {
		method: "PUT",
		body: JSON.stringify({
			on: true,
			bri: Number(brightness),
			ct: Number(colorTemp)
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
	var light = document.getElementById(lightID);
	light.children["OnOffButton"].value = "Éteindre";
	light.children["OnOffButton"].style.backgroundColor = lightOn;

	// Check if all the lights of the room are turned on
	if(isAllLightsOfGroupOn(light.parentNode.parentNode.id) === true)
	{
		button = light.parentNode.parentNode.children["groupHeader"].children["GroupOnOffButton"]
		button.value = "Tout éteindre";
		button.style.backgroundColor = lightOn;
	}
}

function TurnOffLight(lightID)
{
	
	fetch("http://" + bridgeIP + "/api/" + username + "/lights/" + lightID + "/state", {
		method: "PUT",
		body: JSON.stringify({
			on: false
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
	var light = document.getElementById(lightID);
	light.children["OnOffButton"].value = "Allumer";
	light.children["OnOffButton"].style.backgroundColor = lightOff;

	// Check if all the lights of the room are turned on
	if(isAllLightsOfGroupOn(light.parentNode.parentNode.id) === false)
	{
		button = light.parentNode.parentNode.children["groupHeader"].children["GroupOnOffButton"]
		button.value = "Tout allumer";
		button.style.backgroundColor = lightOff;
	}
}

function ChangeBrightness(lightID)
{
	var brightness = document.getElementById(lightID).children["Sliders"].children["BrightnessLabel"].children["Brightness"].value;
	fetch("http://" + bridgeIP + "/api/" + username + "/lights/" + lightID + "/state", {
		method: "PUT",
		body: JSON.stringify({
			bri: Number(brightness)
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}

function ChangeColorTemp(lightID)
{
	var colorTemp = document.getElementById(lightID).children["Sliders"].children["ColorTempLabel"].children["ColorTemp"].value;
	fetch("http://" + bridgeIP + "/api/" + username + "/lights/" + lightID + "/state", {
		method: "PUT",
		body: JSON.stringify({
			ct: Number(colorTemp)
		}),
		headers: {
			"Content-type": "application/json; charset=UTF-8"
		}
	});
}

function InitCallback()
{
	if(bConfigurationChecked === false)
	{
		// Check configuration
		var configError = "";
		if(typeof bridgeIP === 'undefined' || bridgeIP === "")
			configError += "Bridge IP is not defined<br>"
		if(typeof username === 'undefined' || username === "")
			configError += "Username is not defined<br>"
		if(typeof updateFrequency === 'undefined')
			configError += "updateFrequency is not set<br>"

		if(configError !== "")
		{
			document.getElementById("errors").innerHTML += configError;
			document.getElementById("errors").style.display = "block";
			return 0
		}

		if(updateFrequency < 1)
		{
			console.log("Update frequency to fast, set to 30 seconds")
			updateFrequency = 30;
		}
		
		// Update displayed values every x seconds
		setInterval(InitCallback, updateFrequency * 1000)
		bConfigurationChecked = true
	}
	
	fetch("http://" + bridgeIP + "/api/" + username + "/lights/")
			.then((response) => response.json())
			.then((json) => Init(json));
	
}

function Init(json)
{
	// Generate HTML
	var groupsParent = document.getElementById("groups");
	groupsParent.innerHTML = "";
	for(var nGroup = 0; nGroup < config_Groups.length; nGroup++)
	{
		groupsParent.innerHTML +=       
		"<div class=\"group\" id=\"" + config_Groups[nGroup][0] + "\">" +
        	"<div name=\"groupHeader\" class=\"groupHeader\">" +
            	"<div class=\"groupName\">" + config_Groups[nGroup][0] + "</div>" +
            	"<input class=\"GroupOnOffButton\" name=\"GroupOnOffButton\" type=\"button\" value=\"Tout allumer\" onclick=\"ToggleStates('" + config_Groups[nGroup][0] + "')\">" +
        	"</div>" +
        	"<div name=\"lights\" class=\"lights\"></div>" +
      	"</div>"

		var lightsParent = document.getElementById(config_Groups[nGroup][0]).children["lights"];
		lightsParent.innerHTML = "";
		for(var nLight = 1; nLight < config_Groups[nGroup].length; nLight++)
		{
			lightsParent.innerHTML += 
				"<div class=\"light\" id=\"" + config_Groups[nGroup][nLight] + "\">" + 
	              "<div class=\"LightName\" name=\"LightName\"></div>" +
	              "<div class=\"Sliders\" name=\"Sliders\">"+
	                "<label class=\"BrightnessLabel\" name=\"BrightnessLabel\">Puissance <input name=\"Brightness\" class=\"Brightness\" type=\"range\" min=\"1\" max=\"255\" value=\"255\" onchange=\"ChangeBrightness(" + config_Groups[nGroup][nLight] + ")\"></label>"+
	                "<label class=\"ColorTempLabel\" name=\"ColorTempLabel\">Température <input name=\"ColorTemp\" class=\"ColorTemp\" type=\"range\" onchange=\"ChangeColorTemp(" + config_Groups[nGroup][nLight] + ")\"></label>"+
	              "</div>"+
	              "<input name=\"OnOffButton\" type=\"button\" value=\"Allumer\" onclick=\"ToggleState(" + config_Groups[nGroup][nLight] + ")\">"+
	            "</div>"
		}
	}

	

	// Set values
	var GroupsList = document.getElementsByClassName("group");
	for(var nGroupIndex = 0; nGroupIndex < GroupsList.length; nGroupIndex++)
	{
		var LightsList = document.getElementsByClassName("light");
		for(var nIndex = 0; nIndex < LightsList.length; nIndex++)
		{
			var light = LightsList[nIndex];
			setOnOffValue(light, json);
			setBrightness(light, json);
			setLightName(light, json);
			if(json[light.id].state.hasOwnProperty("ct")
			&& json[light.id].capabilities.control.ct.hasOwnProperty("min")
			&& json[light.id].capabilities.control.ct.hasOwnProperty("max"))
				setColorTemp(light, json);
			else {
				light.children["Sliders"].children["ColorTempLabel"].style.display = "none";
				light.children["Sliders"].children["BrightnessLabel"].style.width = "580px";
				light.children["Sliders"].children["BrightnessLabel"].children["Brightness"].style.width = "540px";
			}
		}

		if(isAllLightsOfGroupOn(GroupsList[nGroupIndex].id) === true)
		{
			GroupsList[nGroupIndex].children["groupHeader"].children["GroupOnOffButton"].value = "Tout éteindre";
			GroupsList[nGroupIndex].children["groupHeader"].children["GroupOnOffButton"].style.backgroundColor = lightOn;
		}
		else
		{
			GroupsList[nGroupIndex].children["groupHeader"].children["GroupOnOffButton"].value = "Tout allumer";
			GroupsList[nGroupIndex].children["groupHeader"].children["GroupOnOffButton"].style.backgroundColor = lightOff;
		}

	}

	document.getElementById("LastUpdate").innerHTML = "Last update : " + new Date().toLocaleString();
}

function setOnOffValue(light, json)
{
	if(json[light.id].state.on === false) {
		light.children["OnOffButton"].value = "Allumer";
		light.children["OnOffButton"].style.backgroundColor = lightOff;
	}
	else {
		light.children["OnOffButton"].value = "Éteindre";
		light.children["OnOffButton"].style.backgroundColor = lightOn;
	}
}

function setBrightness(light, json)
{
	light.children["Sliders"].children["BrightnessLabel"].children["Brightness"].value = json[light.id].state.bri;
}

function setLightName(light,json)
{
	light.children["LightName"].innerHTML = json[light.id].name;
}

function setColorTemp(light, json)
{
	light.children["Sliders"].children["ColorTempLabel"].children["ColorTemp"].min = json[light.id].capabilities.control.ct.min;
	light.children["Sliders"].children["ColorTempLabel"].children["ColorTemp"].max = json[light.id].capabilities.control.ct.max;
	light.children["Sliders"].children["ColorTempLabel"].children["ColorTemp"].value = json[light.id].state.ct;
}

function isAllLightsOfGroupOn(groupID) {
	var lightsGroup = document.getElementById(groupID);
	for (var nIndex = 0; nIndex < lightsGroup.children["lights"].children.length; nIndex++) {
		if(lightsGroup.children["lights"].children[nIndex].children["OnOffButton"].value === "Allumer")
		{
			return false;
		}
	}
	return true;
}
