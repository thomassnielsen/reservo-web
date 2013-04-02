var reservoRetina = window.devicePixelRatio >= 1.3;
var reservoRestaurantData;
var reservoBooking = new Array();
var reservoAvailableStations = new Array();
var reservoBoolAutoscrolling = false;

var reservoBrevBredde = 450;
var reservoBordBredde = 660;


window.onload = function()
{
	console.log("window.onload()");
  if (document.getElementById("reservo-container"))
  {
    loadRestaurant(reservoRestaurantId, false, false);
    addInputHandlers();
  }
}

/* Load data */
function loadRestaurant(id, renderInput, renderStations)
{
	console.log("loadRestaurant()");
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
    {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
      {
        parseRestaurantJSON(xmlhttp.responseText);
        if (renderInput)
          createInputFields();
        if (renderStations)
          showAvailableStations();

        loadDays();
        loadHoursForDayRelativeToToday(0);
      }
    }
  xmlhttp.open("POST","http://pido.cc/api_open/get_restaurant_by_id",true);
  xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  xmlhttp.send("id="+id);
}

function loadBusyTimesForPlaceDayAndPeople(id, day, people)
{
	console.log("loadBusyTimesForPlaceDayAndPeople()");
	var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
    {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
      {
        var parsedData = JSON.parse(xmlhttp.responseText);
        updateBusyTimes(parsedData);
      }
    }
  xmlhttp.open("POST","http://pido.cc/api_open/get_busy_hours_for_day_and_place_and_people",true);
  xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  xmlhttp.send("place_id="+id+"&day="+day+"&people="+people);
}

function loadAvailableStationsForPlaceTimeAndPeople(id, time, people, renderStations)
{
	console.log("loadAvailableStationsForPlaceTimeAndPeople()");
  var xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange=function()
    {
    if (xmlhttp.readyState==4 && xmlhttp.status==200)
      {
        parseStationJSON(xmlhttp.responseText);
        if (renderStations)
          showAvailableStations();
      }
    }
  xmlhttp.open("POST","http://pido.cc/api_open/get_available_stations_for_time_and_place_and_peoplecount",true);
  xmlhttp.setRequestHeader("Content-type","application/x-www-form-urlencoded");
  xmlhttp.send("place_id="+id+"&time="+time+"&people="+people);
}

function parseRestaurantJSON(data)
{
	console.log("parseRestaurantJSON()");
  var parsedData = JSON.parse(data);
  reservoRestaurantData = parsedData;
}

function parseStationJSON(data)
{
	console.log("parseStationJSON()");
  var parsedData = JSON.parse(data);
  reservoRestaurantData.stations = parsedData;
}

function loadDays()
{
	console.log("loadDays()");
  if (!document.getElementById("reservo-dato"))
    return; // No select box to fill with days.

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
  var datePicker = document.getElementById("reservo-dato");
  datePicker.innerHTML = "";
  for (i = 0; i < 14; i++)
  {
    var thisDay = today+i;

    while (thisDay > 6)
      thisDay -= 7;

    var option = document.createElement("option");
    option.value = i;
    if (i > 6)
      option.innerHTML = "neste ";
    option.innerHTML += weekday[thisDay];

    if (i == 0)
      option.innerHTML = "i dag";
    if (i == 1)
      option.innerHTML = "i morgen";

    datePicker.appendChild(option);
  }
}

function loadHoursForDayRelativeToToday(dayRelativeToToday)
{
	console.log("loadHoursForDayRelativeToToday()");
  if (!document.getElementById("reservo-tidspunkt"))
    return; // No element to fill. Go home script, you're drunk.

  date = new Date();
  date.setDate(date.getDate()+dayRelativeToToday);
  date.setDate(date.getDate()+1); // Mondag first damnit!
  var selectedDay = date.getDay() + 1; // 1-7 instead of 0-6

  var openingHourObject;
  for (var openingHourObjectIndex in reservoRestaurantData.opening_hours)
  {
    if (reservoRestaurantData.opening_hours[openingHourObjectIndex].days.indexOf(selectedDay) !== -1)
    {
      openingHourObject = reservoRestaurantData.opening_hours[openingHourObjectIndex];
      break;
    }
  }

  var timePicker = document.getElementById("reservo-tidspunkt");
  timePicker.innerHTML = "";

  var numberOfHours = (openingHourObject.close-openingHourObject.open)/15;

  for (i = 0; i <= numberOfHours; i++)
  {
    var time = parseInt(openingHourObject.open) + parseInt(i*15);
    var option = document.createElement("option");
    option.value = time;

    if (reservoBooking.time)
    {
      if (reservoBooking.time == time)
        option.setAttribute("selected", "selected");
    }

    var hour = parseInt(time/60);
    if (hour < 10)
      hour = "0"+hour;
    var minute = time - hour*60;
    if (minute < 10)
      minute = "0"+minute;

    option.innerHTML = hour+":"+minute;
    timePicker.appendChild(option);
  }

  date = new Date();
  date.setDate(date.getDate()+dayRelativeToToday);
  loadBusyTimesForPlaceDayAndPeople(reservoRestaurantData.id, date.getDate(), document.getElementById("reservo-person-antall").value);
}

/* Render page */
function createInputFields()
{
	console.log("createInputFields()");
	var containerSection = document.getElementById("reservo-container");
  if (!containerSection)
  {
    containerSection = document.createElement("section");
    containerSection.id = "reservo-container";
    containerSection.className = "reservo-container reservo-invisible";

    var header = document.createElement("header");
    header.innerHTML = "<h1>Min reservasjon</h1>";

    var closeButton = document.createElement("a");
    closeButton.id = "reservo-overlay-lukk";
    closeButton.href = "javascript:void(0)";
    closeButton.className = "reservo-overlay-lukk";
    closeButton.innerHTML = "x";

    // We need a montage!
    header.appendChild(closeButton);
    containerSection.appendChild(header);
    document.body.appendChild(containerSection);
    setTimeout(function(){ // We need some delay so we're sure that the element is present in the DOM.
	    containerSection.className = "reservo-container";
    }, 100);
  }

  if (document.getElementById("reservo-brev"))
    return; // No need to create it twice

  var inputSection = document.createElement("section");
  inputSection.id = "reservo-brev";
  inputSection.className = "reservo-seksjon reservo-brev reservo-active";

  /*
   Create textfield for name
   Example: <input type="text" placeholder="Jan Petter">
   */
  var nameField = document.createElement("input");
  nameField.id = "reservo-navn";
  nameField.type = "text";
  nameField.setAttribute("placeholder", "Jan Petter");

  /*
   Create textfield for phone number
   Example: <input type="number" max="24" min="1" value="3">
  */
  var peopleCountField = document.createElement("input");
  peopleCountField.id = "reservo-person-antall";
  peopleCountField.type = "number";
  peopleCountField.setAttribute("max", reservoRestaurantData.max_booking);
  peopleCountField.setAttribute("min", reservoRestaurantData.min_booking);
  peopleCountField.setAttribute("value", "4");

  var datePicker = document.createElement("select");
  datePicker.id = "reservo-dato";

  var timePicker = document.createElement("select");
  timePicker.id = "reservo-tidspunkt";

  var phoneField = document.createElement("input");
  phoneField.id = "reservo-phone";
  phoneField.type = "tel";
  phoneField.setAttribute("placeholder", "12345678");

  // Yeah a fucking montage!
  var inputSectionWrapper = document.createElement("fieldset");
  inputSectionWrapper.innerHTML += "Jeg, ";
  inputSectionWrapper.appendChild(nameField);
  inputSectionWrapper.innerHTML += " ønsker å reservere et bord for ";
  inputSectionWrapper.appendChild(peopleCountField);
  inputSectionWrapper.innerHTML += " personer på "+reservoRestaurantData.name+" ";
  inputSectionWrapper.appendChild(datePicker);
  inputSectionWrapper.innerHTML += " klokken ";
  inputSectionWrapper.appendChild(timePicker);
  inputSectionWrapper.innerHTML += ". Dere kan nå meg på ";
  inputSectionWrapper.appendChild(phoneField);
  inputSectionWrapper.innerHTML += " (mobil).<br>";
  inputSection.appendChild(inputSectionWrapper);

  var continueButton = document.createElement("a");
  continueButton.id = "reservo-continue-button";
  continueButton.className = "reservo-button";
  continueButton.innerHTML = "Fortsett";
  continueButton.href = "javascript:void(0)";
  inputSection.appendChild(continueButton);

  containerSection.appendChild(inputSection);

  var stationSection = document.createElement("section");
  stationSection.id = "reservo-bordvalg";
  stationSection.className = "reservo-seksjon reservo-bordvalg";
  containerSection.appendChild(stationSection);

  addInputHandlers();

  loadDays();
  loadHoursForDayRelativeToToday(0);
}

function updateBusyTimes(timesArray)
{
	console.log("updateBusyTimes()");
	var timeSelectElement = document.getElementById("reservo-tidspunkt");
	var optCount = timeSelectElement.options.length;

	for (var time in timesArray)
	{
		for (var i = 0; i < optCount; i++)
		{
			if (timeSelectElement.options[i].value == time)
			{
				timeSelectElement.options[i].setAttribute("disabled", "disabled");
				timeSelectElement.options[i].style.setProperty("text-decoration", "line-through");
				break;
			}
		}
	}
}

function addInputHandlers()
{
	console.log("addInputHandlers()");
  document.getElementById("reservo-continue-button").addEventListener("click", function(){
    findAvailableStations();
  }, false);
  document.getElementById("reservo-person-antall").addEventListener("change", function(){
	  loadHoursForDayRelativeToToday(document.getElementById("reservo-dato").value);
  });
  document.getElementById("reservo-dato").addEventListener("change", function(){
    dateChanged();
  }, false);
  document.getElementById("reservo-tidspunkt").addEventListener("change", function(){
    timeChanged();
  }, false);
  document.getElementById("reservo-overlay-lukk").addEventListener("click", function(){
  	document.getElementById("reservo-container").style.opacity = "0.0";
  	setTimeout(function(){
	  	document.getElementById("reservo-container").parentNode.removeChild(document.getElementById("reservo-container"));
  	}, 1000);
  }, false);
}

function addStationElementsToDOM()
{
	console.log("addStationElementsToDOM()");
  if (!reservoRestaurantData.stations)
  {
    loadAvailableStationsForPlaceTimeAndPeople(reservoRestaurantData.id, dayFromTodayAndMinutesToTimestamp(reservoBooking.date, reservoBooking.time), reservoBooking.peopleCount, true);
    return;
  }

  var first = true;
  for (var station in reservoRestaurantData.stations)
  {
    var stationObject = reservoRestaurantData.stations[station];

    var stationElement = document.createElement("li");
    stationElement.id = "station"+stationObject.id;

    if (first == true)
    {
      reservoBooking.station = stationObject.id;
      stationElement.className = "reservo-bord-anbefalt ";
      first = false;
    }

    var stationImage = new Image();
    stationImage.src = "http://pido.cc/img/stationImages/"+stationObject.imageName;
    if (reservoRetina)
      stationImage.src = stationImage.src.replace('.jpg', '@2x.jpg');
    stationImage.height = "280";
    stationImage.width = "280";
    stationElement.appendChild(stationImage);

    if (!document.getElementById("reservo-bord"))
    {
      divElement = document.createElement("div");
      divElement.id = "reservo-bord";
      divElement.className = "reservo-bord";

      var prevArrow = document.createElement("a");
      prevArrow.id = "reservo-forrige-bord";
      prevArrow.className = "reservo-forrige-bord";
      prevArrow.href = "javascript:void(0)";
      prevArrow.innerHTML = "⟨";
      divElement.appendChild(prevArrow);

      wrapperElement = document.createElement("div");
      wrapperElement.id = "reservo-karusell-wrapper";
      wrapperElement.className = "reservo-karusell-wrapper";

      ulElement = document.createElement("ul");
      ulElement.id = "reservo-karusell";
      ulElement.className = "reservo-karusell";

      wrapperElement.appendChild(ulElement);
      divElement.appendChild(wrapperElement);

      var nextArrow = document.createElement("a");
      nextArrow.id = "reservo-neste-bord";
      nextArrow.className = "reservo-neste-bord";
      nextArrow.href = "javascript:void(0)";
      nextArrow.innerHTML = "⟩";
      divElement.appendChild(nextArrow);

      document.getElementById("reservo-bordvalg").appendChild(divElement);
    }

    reservoAvailableStations.push(stationElement);
    document.getElementById("reservo-karusell").appendChild(stationElement);
  }

  document.getElementById("reservo-forrige-bord").addEventListener("click", function(){
    selectPrevStation();
  });

  document.getElementById("reservo-neste-bord").addEventListener("click", function(){
    selectNextStation();
  });

  document.getElementById("reservo-karusell").style.width = (300*reservoAvailableStations.length-20)+"px"; // -20 because the wrapper is 280, not 300

  var timer = null;
  document.getElementById("reservo-karusell-wrapper").addEventListener("scroll", function(){
    var wrapper = document.getElementById("reservo-karusell-wrapper");
    if (wrapper.scrollLeft > (parseInt(document.getElementById("reservo-karusell").style.width) - 300))
      return;

    if (reservoBoolAutoscrolling)
      return;

    if(timer !== null) {
        clearTimeout(timer);
    }
    timer = setTimeout(function() {
          var target;
          if (wrapper.scrollLeft % 300 < 150)
             target = wrapper.scrollLeft - (wrapper.scrollLeft % 300);
          else
             target = wrapper.scrollLeft + 300-(wrapper.scrollLeft % 300);

          scrollStationPickerTo(target);

          timeout = setTimeout(function(){
            clearInterval(timer);
            wrapper.scrollLeft = target;
            // Set selected station

            for (var stationElementIndex in reservoAvailableStations)
            {
              var stationElement = reservoAvailableStations[stationElementIndex];
              var newOffset = stationElement.offsetLeft - document.getElementById("reservo-karusell").getElementsByTagName("li")[0].offsetLeft;
              if (newOffset == target)
              {
                stationId = stationElement.id.replace("station", "");
                reservoBooking.station = stationId;
                console.log(reservoBooking);
              }
            }
          }, 200);
    }, 150);
  }, false);
}

function createStationSelectionSummary()
{
	console.log("createStationSelectionSummary()");
  if (!document.getElementById("reservo-sammendrag"))
  {
    var asideElement = document.createElement("aside");
    asideElement.id = "reservo-sammendrag";
    asideElement.className = "reservo-sammendrag";
    document.getElementById("reservo-bordvalg").appendChild(asideElement);
  }

  var summaryElement = document.getElementById("reservo-sammendrag");


  var fieldsetElement = summaryElement.getElementsByTagName("fieldset")[0];
  if (!fieldsetElement)
  {
    fieldsetElement = document.createElement("fieldset");
    summaryElement.appendChild(fieldsetElement);
  }

  fieldsetElement.innerHTML = "";

  var hour = parseInt(reservoBooking.time/60);
  if (hour < 10)
    hour = "0"+hour;

  var minute = reservoBooking.time-hour*60;
  if (minute < 10)
    minute = "0"+minute;

  var date = new Date();
  date.setDate(date.getDate()+parseInt(reservoBooking.date));

  var months = new Array();
  months[0] = "jan";
  months[1] = "feb";
  months[2] = "mar";
  months[3] = "apr";
  months[4] = "mai";
  months[5] = "jun";
  months[6] = "jul";
  months[7] = "aug";
  months[8] = "sep";
  months[9] = "okt";
  months[10] = "nov";
  months[11] = "des";

  var pElement = document.createElement("p");
  pElement.innerHTML = "Bord for <span>"+reservoBooking.peopleCount + " personer</span> den <span>" + date.getDate() + ". " + months[date.getMonth()] + "</span> klokken <span>" + hour +":"+ minute + "</span>.";

  var spanElement = document.createElement("span");
  spanElement.className = "reservo-rediger-markering";
  spanElement.innerHTML = "Redigér";

  fieldsetElement.appendChild(pElement);
  fieldsetElement.appendChild(spanElement);
}

/* Input handlers */
function dateChanged()
{
	console.log("dateChanged()");
  var datePicker = document.getElementById("reservo-dato");

  loadHoursForDayRelativeToToday(datePicker.value);
}

function timeChanged()
{
	console.log("timeChanged()");
  reservoBooking.time = document.getElementById("reservo-tidspunkt").value;
}

/* Navigation */
function showAvailableStations()
{
	console.log("showAvailableStations()");
  reservoBooking.name = document.getElementById("reservo-navn").value;
  reservoBooking.date = document.getElementById("reservo-dato").value;
  reservoBooking.time = document.getElementById("reservo-tidspunkt").value;
  reservoBooking.peopleCount = document.getElementById("reservo-person-antall").value;
  reservoBooking.phone = document.getElementById("reservo-phone").value;

  /* Temp disabled
  if (reservoBooking.name.length < 2)
  {
    alert ("navn mangler");
    return;
  }

  if (reservoBooking.phone.length < 8)
  {
    alert("Telefonnummer mangler");
    return;
  }
  */

  var inputSection = document.getElementById("reservo-brev");
  var stationSection = document.getElementById("reservo-bordvalg");
  var containerSection = document.getElementById("reservo-container");

  // Animate instead of hidden here
  removeClassFromElement("reservo-active", inputSection);
  setClassOnElement("reservo-active", stationSection);
  setClassOnElement("reservo-bordvalg-active", containerSection);

  // Fjernet midlertidig for å teste setting av disse med klasser. -KR
  /* containerSection.style.width = reservoBordBredde+"px";
  containerSection.style.marginLeft = "-"+(reservoBordBredde/2)+"px"; */

  addStationElementsToDOM();
  createStationSelectionSummary();
}

function backToInputFields()
{
	console.log("backToInputFields()");
  reservoRestaurantData.station = null;

  var inputSection = document.getElementById("reservo-brev");
  var stationSection = document.getElementById("reservo-bordvalg");
  var containerSection = document.getElementById("reservo-container");

  removeClassFromElement("reservo-active", stationSection);
  setClassOnElement("reservo-active", inputSection);
  removeClassFromElement("reservo-bordvalg-active", containerSection);
  setClassOnElement("reservo-brev-active", containerSection);

  // Fjernet midlertidig for å teste setting av disse med klasser. -KR
  /* containerSection.style.width = reservoBrevBredde+"px";
  containerSection.style.marginLeft = "-"+(reservoBrevBredde/2)+"px"; */
}

/* Button / Control functions */
function loadReservoWithRestaurant(id)
{
	console.log("loadReservoWithRestaurant()");
  loadRestaurant(id, true, false);
}

function findAvailableStations()
{
	console.log("findAvailableStations()");
  if (!reservoRestaurantData)
    loadRestaurant(reservoRestaurantId, false, true);
  else
    showAvailableStations();
}

function selectNextStation()
{
	console.log("selectNextStation()");
  scrollStationPickerTo(document.getElementById("reservo-karusell-wrapper").scrollLeft+300);
}

function selectPrevStation()
{
	console.log("selectPrevStation()");
  scrollStationPickerTo(document.getElementById("reservo-karusell-wrapper").scrollLeft-300);
}

function scrollStationPickerTo(target)
{
	console.log("scrollStationPickerTo()");
  reservoBoolAutoscrolling = true;

  var wrapper = document.getElementById("reservo-karusell-wrapper");

  var intervalValue = (target - wrapper.scrollLeft)/(200/20);

  var intervalTimer = setInterval(function(){
    if (wrapper.scrollLeft < target)
      wrapper.scrollLeft = wrapper.scrollLeft + intervalValue;
    else
      wrapper.scrollLeft = wrapper.scrollLeft + intervalValue;
  }, 20);

  var stopTimer = setTimeout(function(){
    clearInterval(intervalTimer);
    wrapper.scrollLeft = target;
    reservoBoolAutoscrolling = false;
  }, 200);
}

/* DOM helpers */
function removeClassFromElement(theClass, theElement)
{
	var removeReg = new RegExp('(\\s|^)'+theClass+'(\\s|$)');
	theElement.className=theElement.className.replace(removeReg,'');
}

function setClassOnElement(theClass, theElement)
{
	removeClassFromElement(theClass, theElement); // prevents double setting
	theElement.className += ' '+theClass;
}

/* Math and converting helpers */
function dayFromTodayAndMinutesToTimestamp(dayFromToday, minutes)
{
	console.log("dayFromTodayAndMinutesToTimestamp()");
	var date = new Date();
  date.setDate(date.getDate()+parseInt(dayFromToday));
  date.setUTCHours(0,minutes,0,0);

  console.log(date.getTime()/1000);
}