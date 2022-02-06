import {enablePromise, openDatabase} from 'react-native-sqlite-storage';
import {formatDate, rebuildTime, timeFormatter} from './helpers';

enablePromise(true);
const tableName = 'CLOCKING';

async function getDBConnection() {
  return openDatabase({name: 'clocking.db', location: 'default'});
}

async function createTable(connection) {
  // create table if not exists
  const query = `CREATE TABLE IF NOT EXISTS ${tableName}(
        state TEXT NOT NULL,
        year NUMBER,
        month NUMBER,
        day NUMBER,
        hours NUMBER,
        minutes NUMBER,
        seconds NUMBER,
        milliseconds NUMBER
        
    );`;
  await connection.executeSql(query);
}

let db;

export const repository = {
  async initialize() {
    db = await getDBConnection();
    await createTable(db);
  },
  async save(state, year, month, day, hours, minutes, seconds, milliseconds) {
    const query = `INSERT INTO ${tableName} (state, year, month, day, hours, minutes, seconds, milliseconds)
            VALUES ('${state}', ${year}, ${month}, ${day}, ${hours}, ${minutes}, ${seconds}, ${milliseconds});`;
    return await db.executeSql(query);
  },
  buildStatistics(results) {
    let state = 'ENDED';
    let enteringTime = null;
    let timeConsumedToday = {hours: 0, minutes: 0, seconds: 0, milliseconds: 0};
    let timeBreakToday = {hours: 0, minutes: 0, seconds: 0, milliseconds: 0};

    const date = new Date();
    results.push({
      state: 'ENDED',
      hours: date.getHours(),
      minutes: date.getMinutes(),
      seconds: date.getSeconds(),
      milliseconds: date.getMilliseconds(),
    });
    for (let i = 0; i < results.length - 1; i++) {
      const actual = results[i];
      const next = results[i + 1];
      if (
        ['PAUSED', 'ENDED'].includes(next.state) &&
        actual.state === 'STARTED'
      ) {
        timeConsumedToday.hours += next.hours - actual.hours;
        timeConsumedToday.minutes += next.minutes - actual.minutes;
        timeConsumedToday.seconds += next.seconds - actual.seconds;
        timeConsumedToday.milliseconds +=
          next.milliseconds - actual.milliseconds;
      } else if (
        ['STARTED', 'ENDED'].includes(next.state) &&
        actual.state === 'PAUSED'
      ) {
        timeBreakToday.hours += next.hours - actual.hours;
        timeBreakToday.minutes += next.minutes - actual.minutes;
        timeBreakToday.seconds += next.seconds - actual.seconds;
        timeBreakToday.milliseconds += next.milliseconds - actual.milliseconds;
      }
      if (enteringTime === null && actual.state === 'STARTED') {
        enteringTime = new Date(
          actual.year,
          actual.month,
          actual.day,
          actual.hours,
          actual.minutes,
          actual.seconds,
        );
      }
      if (i === results.length - 2) {
        state = actual.state;
      }
    }
    return {state, enteringTime, timeConsumedToday, timeBreakToday};
  },
  async getStatistics() {
    const results =
      await db.executeSql(`SELECT state, year, month, day, hours, minutes, seconds, milliseconds
      FROM ${tableName}
      ORDER BY year, month, day, hours, minutes, seconds, milliseconds`);

    const groupingByAndCollect = [];

    let dayStatistics = [];
    results.forEach(result => {
      for (let i = 0; i < result.rows.length - 1; i++) {
        const actual = result.rows.item(i);
        const next = result.rows.item(i + 1);
        if (
          actual.day === next.day &&
          actual.month === next.month &&
          actual.year === next.year
        ) {
          dayStatistics.push(actual);
        } else {
          let {timeConsumedToday, timeBreakToday} =
            this.buildStatistics(dayStatistics);
          dayStatistics = [];
          groupingByAndCollect.push({
            date: {year: actual.year, month: actual.month, day: actual.day},
            timeBreakToday: timeFormatter(rebuildTime(timeBreakToday)),
            timeConsumedToday: timeFormatter(rebuildTime(timeConsumedToday)),
          });
        }
      }
      if (result.rows.length !== 0) {
        const actual = result.rows.item(result.rows.length - 1);
        const before = dayStatistics[0];
        if (before) {
          if (
            actual.day === before.day &&
            actual.month === before.month &&
            actual.year === before.year
          ) {
            dayStatistics.push(actual);
          } else {
            let {timeConsumedToday, timeBreakToday} =
              this.buildStatistics(dayStatistics);
            groupingByAndCollect.push({
              date: {year: actual.year, month: actual.month, day: actual.day},
              timeBreakToday: timeFormatter(rebuildTime(timeBreakToday)),
              timeConsumedToday: timeFormatter(rebuildTime(timeConsumedToday)),
            });
            dayStatistics = [actual];
          }
        } else {
          dayStatistics.push(actual);
        }

        let {timeConsumedToday, timeBreakToday} =
          this.buildStatistics(dayStatistics);
        groupingByAndCollect.push({
          date: {year: actual.year, month: actual.month, day: actual.day},
          timeBreakToday: timeFormatter(rebuildTime(timeBreakToday)),
          timeConsumedToday: timeFormatter(rebuildTime(timeConsumedToday)),
        });
      }
    });
    return groupingByAndCollect;
  },
  async getTodayStatistics(year, month, day) {
    const results =
      await db.executeSql(`SELECT state, year, month, day, hours, minutes, seconds, milliseconds
      FROM ${tableName}
      WHERE year=${year} AND month=${month} AND day = ${day} 
      ORDER BY year, month, day, hours, minutes, seconds, milliseconds`);
    const items = [];
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        items.push(result.rows.item(index));
      }
    });
    let {state, enteringTime, timeConsumedToday, timeBreakToday} =
      this.buildStatistics(items);
    return {
      state,
      enteringTime,
      timeConsumedToday: rebuildTime(timeConsumedToday),
      timeBreakToday: rebuildTime(timeBreakToday),
    };
  },
  async findByYearMonthDay(year, month, day) {
    const results =
      await db.executeSql(`SELECT state, year, month, day, hours, minutes, seconds, milliseconds
      FROM ${tableName}
      WHERE year=${year} AND month=${month} AND day = ${day} 
      ORDER BY year, month, day, hours, minutes, seconds, milliseconds`);

    const mappedResult = [];
    results.forEach(result => {
      for (let index = 0; index < result.rows.length; index++) {
        mappedResult.push(result.rows.item(index));
      }
    });
    return mappedResult;
  },
  async clear() {
    await db.executeSql(`DELETE FROM ${tableName}`);
  },
};
