import { templates, select, settings, classNames } from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import { utils } from '../utils.js';

export class Booking {
  constructor(element) {
    this.container = element;
    this.render(element);
    this.initWidgets();
    this.initButtons();
    this.getData();
  }

  render(element) {
    const thisBooking = this;
    thisBooking.dom = {};
    thisBooking.dom.wrapper = element;
    thisBooking.dom.wrapper.innerHTML = templates.bookingWidget();
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.bookTable = thisBooking.dom.wrapper.querySelector(select.booking.bookTable);
    thisBooking.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
    thisBooking.dom.phone = element.querySelector(select.booking.phone);
    thisBooking.dom.address = element.querySelector(select.booking.address);
    thisBooking.openingTime = element.querySelector(select.widgets.hourPicker.rangeSlider).getAttribute('min');
    thisBooking.closureTime = element.querySelector(select.widgets.hourPicker.rangeSlider).getAttribute('max');
    thisBooking.rangeStep = utils.numberToHour(element.querySelector(select.widgets.hourPicker.rangeSlider).getAttribute('step'));
    thisBooking.dom.rangeSlider = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.rangeSlider);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function (element) {
      element.target.classList.contains('range-slider') ? null : thisBooking.colorRangeSlider();
      thisBooking.clearBookedTable();
      thisBooking.updateDOM();
    });
  }

  initButtons() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {
      table.addEventListener('click', thisBooking.bookTable.bind(thisBooking));
    }

    thisBooking.dom.bookTable.addEventListener('click', thisBooking.sendBooking.bind(thisBooking));
  }

  getData() {
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam
      ],
      eventsRepeat: [
        endDateParam
      ],
    };

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking
        + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsCurrent.join('&'),
      eventsRepeat: settings.db.url + '/' + settings.db.event
        + '?' + params.eventsRepeat.join('&')
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat)
    ])
      .then(respArr => respArr.map(r => r.json()))
      .then(jsons => Promise.all(jsons))
      .then(([bookings, eventsCurrent, eventsRepeat]) => {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};

    for (let item of bookings) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let item of eventsCurrent) {
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for (let item of eventsRepeat) {
      if (item.repeat === 'daily') {
        for (let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    thisBooking.colorRangeSlider();
    thisBooking.updateDOM();
  }

  colorRangeSlider() {
    const thisBooking = this;
    const hours = thisBooking.booked[thisBooking.datePicker.value];
    const timeStep = thisBooking.rangeStep;
    const stepNumbers = (thisBooking.closureTime - thisBooking.openingTime) / utils.hourToNumber(timeStep);

    const a = parseInt(thisBooking.openingTime);
    thisBooking.dom.slider = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.slider);

    let gradient = [];

    for (let startHour = parseInt(thisBooking.openingTime);
      startHour < parseInt(thisBooking.closureTime);
      startHour += utils.hourToNumber(timeStep)) {

      const fromPercent = ((((startHour - a) / utils.hourToNumber(timeStep)) * 100) / stepNumbers).toFixed(2);
      const toPercent = ((((startHour - a) + utils.hourToNumber(timeStep)) / utils.hourToNumber(timeStep) * 100) / stepNumbers).toFixed(2);

      if (!hours || !hours[startHour]) {
        gradient.push(`lightgreen ${fromPercent}%, lightgreen ${toPercent}%`);
      } else if (hours[startHour].includes(1) && hours[startHour].includes(2) && hours[startHour].includes(3)) {
        gradient.push(`red ${fromPercent}%, red ${toPercent}%`);
      } else if (hours[startHour].includes(1) && hours[startHour].includes(2) || hours[startHour].includes(1) && hours[startHour].includes(3) || hours[startHour].includes(2) && hours[startHour].includes(3)) {
        gradient.push(`yellow ${fromPercent}%, yellow ${toPercent}%`);
      } else {
        gradient.push(`lightgreen ${fromPercent}%, lightgreen ${toPercent}%`);
      }
    }
    gradient = gradient.join();
    thisBooking.dom.slider.style.background = `linear-gradient(to right, ${gradient})`;
  }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] === 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] === 'undefined'

    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);

      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        (
          !allAvailable &&
          thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
        ) ||
        thisBooking.bookedTable === tableId
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  makeBooked(date, hour, duration, table) {
    const thisBooking = this;
    const timeStep = thisBooking.rangeStep;

    if (typeof thisBooking.booked[date] === 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += utils.hourToNumber(timeStep)) {
      if (typeof thisBooking.booked[date][hourBlock] === 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }

      thisBooking.booked[date][hourBlock].push(table);
    }
  }

  bookTable(event) {
    const thisBooking = this;
    const clickedTable = parseInt(event.target.dataset.table);
    const isBooked = (thisBooking.booked[thisBooking.date][thisBooking.hour] || []).includes(clickedTable);

    if (!isBooked) {
      thisBooking.bookedTable = clickedTable;
      thisBooking.updateDOM();
    }
  }

  clearBookedTable() {
    const thisBooking = this;
    thisBooking.bookedTable = undefined;
  }

  sendBooking(event) {
    event.preventDefault();
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const formData = utils.serializeFormToObject(thisBooking.form);

    const bookingDetails = {
      date: formData.date.toString(),
      hour: utils.numberToHour(formData.hour.toString()),
      table: thisBooking.bookedTable,
      duration: parseInt(formData.hours.toString()),
      ppl: parseInt(formData.people.toString()),
      starters: formData.starter,
      phone: formData.phone.toString(),
      address: formData.address.toString(),
    };

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingDetails),
    };


    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        thisBooking.getData();
        thisBooking.bookedTable = undefined;
        return parsedResponse;
      });
  }
}

