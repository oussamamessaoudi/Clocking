export function rebuildTime(time) {
  const date = new Date(
    time.milliseconds +
      time.seconds * 1000 +
      time.minutes * 60 * 1000 +
      time.hours * 60 * 60 * 1000,
  );

  return {
    milliseconds: date.getMilliseconds(),
    seconds: date.getSeconds(),
    minutes: date.getMinutes(),
    hours: date.getHours(),
  };
}

export function timeFormatter(time, showMilliseconds) {
  return (
    String(time.hours).padStart(2, '0') +
    ':' +
    String(time.minutes).padStart(2, '0') +
    ':' +
    String(time.seconds).padStart(2, '0') +
    (showMilliseconds ? '.' + String(time.milliseconds).padStart(3, '0') : '')
  );
}

export function formatDate(date) {
  return (
    String(date.day).padStart(2, '0') +
    '/' +
    String(date.month + 1).padStart(2, '0') +
    '/' +
    String(date.year).padStart(4, '0')
  );
}
