var reservoRestaurantData;

/* Load data */
function loadRestaurant(id, renderInput, renderStations)
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState==4 && xmlhttp.status==200)
	    {
		    parseRestaurantJSON(xmlhttp.responseText);
		    if (renderInput)
			    createInputFields();
			  if (renderStations)
			    animateInputFieldsOut();
	    }
	  }
	xmlhttp.open("POST","http://pido.cc/api_open/get_restaurant_by_id",true);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("id="+id);
}

function loadAvailableStationsForPlaceTimeAndPeople(id, time, people, renderStations)
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState==4 && xmlhttp.status==200)
	    {
		    parseStationJSON(xmlhttp.responseText);
			  if (renderStations)
			    animateInputFieldsOut();
	    }
	  }
	xmlhttp.open("POST","http://pido.cc/api_open/get_available_stations_for_time_and_place_and_peoplecount",true);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("place_id="+id+"&time="+time+"&people="+people);
}

function parseRestaurantJSON(data)
{
	var parsedData = JSON.parse(data);
	reservoRestaurantData = parsedData;
}

function parseStationJSON(data)
{
	var parsedData = JSON.parse(data);
	reservoRestaurantData.stations = parsedData;
}

/* Render page */
function createInputFields()
{
var containerSection = document.getElementById("reservo-container");
	if (!containerSection) 
	{
		containerSection = document.createElement("section");
		containerSection.id = "reservo-container";
		containerSection.className = "reservo-container";
		document.body.appendChild(containerSection);
	}

	if (document.getElementById("reservo-brev")) 
		return; // No need to create it twice

	var inputSection = document.createElement("section");
	inputSection.id = "reservo-brev";
	inputSection.className = "reservo-brev";
	
	// Example: <input type="text" placeholder="Jan Petter">
	var nameField = document.createElement("input");
	nameField.type = "text";
	nameField.setAttribute("placeholder", "Jan Petter");
	
	// Example: <input type="number" max="24" min="1" value="3">
	var peopleCountField = document.createElement("input");
	peopleCountField.type = "number";
	peopleCountField.setAttribute("max", reservoRestaurantData.max_booking);
	peopleCountField.setAttribute("min", reservoRestaurantData.min_booking);
	peopleCountField.setAttribute("value", "4");
	
	// 
	var weekday=new Array(7);
	weekday[0]="søndag";
	weekday[1]="mandag";
	weekday[2]="tirsdag";
	weekday[3]="onsdag";
	weekday[4]="torsdag";
	weekday[5]="fredag";
	weekday[6]="lørdag";
	
	var date = new Date();
	var today = date.getDay();
	
	var datePicker = document.createElement("select");
	for (i = 0; i < 14; i++)
	{
		var thisDay = today+i;
		
		while (thisDay > 6)
			thisDay -= 7;
			
		var option = document.createElement("option");
		option.value = i;
		if (i > 6)
			option.innerHTML = "Neste ";
		option.innerHTML += weekday[thisDay];
		
		if (i == 0)
			option.innerHTML = "i dag";
		if (i == 1)
			option.innerHTML = "i morgen";
		
		datePicker.appendChild(option);
	}
	
	var timePicker = document.createElement("select");
	// for (time in availabletimes)
	for (i = 0; i < 24*4; i++)
	{
		var time = i*15;
		var hour = parseInt(time/60);
		var minute = time-hour*60;
		
		var option = document.createElement("option");
		option.value = i;
		if (minute < 10)
			minute = '0'+minute;
		if (hour < 10)
			hour = '0'+hour;
		option.innerHTML = hour + ':' + minute;
		
		if (i == 24*3)
			option.setAttribute("selected", "selected");
		
		timePicker.appendChild(option);
	}
	
	var phoneField = document.createElement("input");
	phoneField.type = "tel";
	phoneField.setAttribute("placeholder", "12345678");
	
	var continueButton = document.createElement("button");
	continueButton.innerHTML = "continue";
	continueButton.setAttribute("onClick", "findAvailableStations();");
	
	// We need a montage!
	inputSection.innerHTML += "Jeg, ";
	inputSection.appendChild(nameField);
	inputSection.innerHTML += " ønsker å reservere et bord for ";
	inputSection.appendChild(peopleCountField);
	inputSection.innerHTML += " personer på "+reservoRestaurantData.name+" ";
	inputSection.appendChild(datePicker);
	inputSection.innerHTML += " klokken ";
	inputSection.appendChild(timePicker);
	inputSection.innerHTML += ". Dere kan nå meg på ";
	inputSection.appendChild(phoneField);
	inputSection.innerHTML += " (mobil).<br>";
	inputSection.appendChild(continueButton);
	
	containerSection.appendChild(inputSection);
}

function addStationElementsToDOM()
{
	if (!reservoRestaurantData.stations)
	{
		loadAvailableStationsForPlaceTimeAndPeople(5, 1364302096, 6, true);
		return;
	}
	for (var station in reservoRestaurantData.stations)
	{
		var stationObject = reservoRestaurantData.stations[station];
		
		var stationElement = document.createElement("figure");
		stationElement.className = "reservoFloatLeft";
		stationElement.id = "station"+stationObject.id;
		stationElement.setAttribute('onclick', "selectStation("+stationObject.id+");");
		
		var stationImage = new Image();
		stationImage.src = "http://pido.cc/img/stationImages/"+stationObject.imageName;
		stationElement.appendChild(stationImage);
  	document.getElementById("reservo-container").appendChild(stationElement);
	}
}

function animateInputFieldsOut()
{
	var inputSection = document.getElementById("reservo-brev");

	// Animate instead of hidden here
	inputSection.style.display = "none";
	
	addStationElementsToDOM();
}

/* Button / Control functions */
function loadReservoWithRestaurant(id)
{
	loadRestaurant(id, true, false);
}

function findAvailableStations()
{
	if (!reservoRestaurantData)
		loadRestaurant(reservoRestaurantId, false, true);
	else
		animateInputFieldsOut();
}

function selectStation(id)
{
	for (var station in reservoRestaurantData.stations)
	{
		var stationObject = reservoRestaurantData.stations[station];
		var stationElement = document.getElementById("station"+stationObject.id);
		stationElement.className = stationElement.className.replace( /(?:^|\s)reservoSelectedStation(?!\S)/g , '');
	}

	var stationElement = document.getElementById("station"+id);
	stationElement.className = "reservoFloatLeft reservoSelectedStation";
}