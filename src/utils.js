
export function scale(domain, range) {
  const [domainStart, domainEnd] = domain;
  const [rangeStart, rangeEnd] = range;
  const domainSpread = domainEnd - domainStart;
  const rangeSpread = rangeEnd - rangeStart;
  return val => {
    const domainPercent = (val - domainStart) / domainSpread;
    return rangeStart + domainPercent * rangeSpread;
  };
}

export function getTypePastTense(type) {
  if (type === "SIT") {
    return "Sat";
  } else {
    return "Stood";
  }
}

export function getStartOfToday() {
  return getStartOfDay(new Date());
}

export function getStartOfDay(date) {
  // Move date to start of day
  date.setHours(0, 0, 0, 0); // setHours actually lets you set everything...
  return date;
}

export function getStartOfTodayInUTCMillis() {
  return getStartOfDayInUTCMillis(new Date());
}

export function convertToUTC(millis) {
  const millisToAdjust = new Date().getTimezoneOffset() * 60 * 1000; // getTimezoneOffset returns offset in minutes and we want it in milliseconds
  return millis + millisToAdjust;
}

export function getStartOfDayInUTCMillis(date) {
  // Move date to start of day
  date.setHours(0, 0, 0, 0); // setHours actually lets you set everything...
  return convertToUTC(date.getTime());
}

export function getEndOfDayInUTCMillis(date) {
  // Move date to end of day
  date.setHours(11, 59, 59, 999);
  return convertToUTC(date.getTime());
}

export function pluralize(single, plural, count) {
  if (count === 1) {
    return single;
  } else {
    return plural;
  }
}

export function formatDurationToHoursAndMinutes(millis, short = false) {
  // First get total minutes
  let minutes = millis / 1000 / 60;
  let hours = 0;
  while (minutes >= 60) {
    hours += 1;
    minutes -= 60;
  }

  let roundedMinutes = Math.round(minutes);
  let minutesText = pluralize("minute", "minutes", roundedMinutes);
  let fullMinutesText = `${roundedMinutes} ${minutesText}`;
  if (hours === 0) {
    if (short) {
      return `${roundedMinutes}m`;
    }
    return fullMinutesText;
  } else {
    if (short) {
      return `${hours}h ${roundedMinutes}m`;
    }
    let hoursText = pluralize("hour", "hours", hours);
    return `${hours} ${hoursText} and ${fullMinutesText}`;
  }
}

export function parseStartAndEndDates() {
  let matches = /start=(\d+)&end=(\d+)/.exec(window.location.search);
  let start;
  let end;
  if (matches && matches.length === 3) {
    start = matches[1];
    end = matches[2];
  }

  return { start, end };
}

export function pad(num) {
  if (num >= 10) {
    return "" + num;
  } else {
    return "0" + num;
  }
}

export function formatTime(date) {
  let hours = date.getHours();
  let minutes = date.getMinutes();
  return `${pad(hours)}:${pad(minutes)}`;
}

export function formatDate(date) {
  return `${date.getMonth() + 1}-${date.getDate()}-${date
    .getFullYear()
    .toString()
    .substr(2, 2)}`;
}

export function isToday(date) {
  return formatDate(new Date()) === formatDate(date);
}

