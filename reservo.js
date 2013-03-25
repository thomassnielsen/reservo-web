var reservoRestaurantData;

function loadRestaurant(id)
{
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange=function()
	  {
	  if (xmlhttp.readyState==4 && xmlhttp.status==200)
	    {
		    parseRestaurantJSON(xmlhttp.responseText);
	    }
	  }
	xmlhttp.open("POST","http://pido.cc/api_open/get_restaurant_by_id",true);
	xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
	xmlhttp.send("id="+id);
	
	var inputSection = document.createElement("section");
	inputSection.id = "reservoInput";
	
	var datePicker = document.createElement("Input");
	datePicker.type = "date";
	
	inputSection.appendChild(datePicker);
	
	document.body.appendChild(inputSection);
	
}

function parseRestaurantJSON(data)
{
	var parsedData = JSON.parse(data);
	reservoRestaurantData = parsedData;
	
	addStationElementsToDOM();
}

function addStationElementsToDOM()
{
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
		
		document.body.appendChild(stationElement);
	}
}

function selectStation(id)
{
	for (var station in reservoRestaurantData.stations)
	{
		var stationObject = reservoRestaurantData.stations[station];
		var stationElement = document.getElementById("station"+stationObject.id);
		stationElement.className = "reservoFloatLeft";
	}

	var stationElement = document.getElementById("station"+id);
	stationElement.className = "reservoFloatLeft reservoSelectedStation";
}