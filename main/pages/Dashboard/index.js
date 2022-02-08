import React, {useEffect, useState} from 'react';
import {
  Alert,
  Button,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import {formatDate, rebuildTime, timeFormatter} from '../../config/helpers';
import {repository} from '../../config/db';
import {Actions} from 'react-native-router-flux';

function Dashboard() {
  const [state, setState] = useState('ENDED');
  const [data, setData] = useState([]);
  const [todayStatistics, setTodayStatistics] = useState({
    enteringTime: null,
    timeConsumedToday: {hours: 0, minutes: 0, seconds: 0, milliseconds: 0},
    timeBreakToday: {hours: 0, minutes: 0, seconds: 0, milliseconds: 0},
  });

  const [goingOutTime, setGoingOutTime] = useState(null);

  function timeToTimestamp(time) {
    return (
      ((time.hours * 60 + time.minutes) * 60 + time.seconds) * 1000 +
      time.milliseconds
    );
  }

  useEffect(() => {
    if (['STARTED', 'PAUSED'].includes(state) && todayStatistics.enteringTime) {
      setGoingOutTime(
        new Date(
          Date.now() +
            (8.5 * 60 * 60 * 1000 -
              timeToTimestamp(todayStatistics.timeConsumedToday) -
              Math.min(
                30 * 60 * 1000,
                timeToTimestamp(todayStatistics.timeBreakToday),
              )),
        ),
      );
    }
  }, [state, todayStatistics]);

  async function reloadData() {
    const date = new Date();
    setData(await repository.getStatistics());
    let todayStats = await repository.getTodayStatistics(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
    setTodayStatistics({
      enteringTime: todayStats.enteringTime,
      timeConsumedToday: todayStats.timeConsumedToday,
      timeBreakToday: todayStats.timeBreakToday,
    });
    setState(todayStats.state);
    setGoingOutTime(null);
  }
  useEffect(() => {
    (async function () {
      await repository.initialize();
      await reloadData();
    })();
  }, []);
  useEffect(() => {
    let interval = setInterval(() => {
      if (state === 'STARTED') {
        setTodayStatistics(
          ({timeConsumedToday, timeBreakToday, enteringTime}) => ({
            timeBreakToday,
            enteringTime: enteringTime || new Date(),
            timeConsumedToday: rebuildTime({
              ...timeConsumedToday,
              milliseconds: timeConsumedToday.milliseconds + 1000,
            }),
          }),
        );
      }
      if (state === 'PAUSED') {
        setTodayStatistics(
          ({timeConsumedToday, timeBreakToday, enteringTime}) => ({
            timeConsumedToday,
            enteringTime,
            timeBreakToday: rebuildTime({
              ...timeBreakToday,
              milliseconds: timeBreakToday.milliseconds + 1000,
            }),
          }),
        );
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state]);

  async function updateState(newState) {
    const date = new Date();
    await repository.save(
      newState,
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds(),
      date.getUTCMilliseconds(),
    );
    setState(newState);
  }

  return (
    <SafeAreaView>
      <StatusBar />
      <View style={styles.container}>
        <View style={styles.statistics}>
          <Text style={styles.timer}>Entry Time</Text>
          <Text style={[styles.timer, styles.info]}>
            {todayStatistics.enteringTime
              ? todayStatistics.enteringTime.toLocaleString('en-FR')
              : '---'}
          </Text>
        </View>
        <View style={styles.statistics}>
          <Text style={styles.timer}>Worked Time</Text>
          <Text style={[styles.timer, styles.worked]}>
            {timeFormatter(todayStatistics.timeConsumedToday)}
          </Text>
        </View>

        <View style={styles.statistics}>
          <Text style={styles.timer}>Break Time</Text>
          <Text style={[styles.timer, styles.break]}>
            {timeFormatter(todayStatistics.timeBreakToday)}
          </Text>
        </View>
        <View style={styles.statistics}>
          <Text style={styles.timer}>Time To Go</Text>
          <Text style={[styles.timer, styles.info]}>
            {goingOutTime ? goingOutTime.toLocaleString('en-FR') : '---'}
          </Text>
        </View>
        <View style={[styles.tr, styles.head]}>
          <Text style={[styles.th, styles.timer]}>Date</Text>
          <Text style={[styles.th, styles.timer]}>Worked Time</Text>
          <Text style={[styles.th, styles.timer]}>Break Time</Text>
        </View>
        <ScrollView style={styles.tbody}>
          {data.map((e, i) => (
            <TouchableHighlight
              key={i}
              activeOpacity={0.6}
              underlayColor="#DDDDDD"
              onPress={() => Actions.detail({date: e.date})}>
              <View key={i} style={styles.tr}>
                <Text style={[styles.td]}>{formatDate(e.date)}</Text>
                <Text style={[styles.td, styles.worked]}>
                  {e.timeConsumedToday}
                </Text>
                <Text style={[styles.td, styles.break]}>
                  {e.timeBreakToday}
                </Text>
              </View>
            </TouchableHighlight>
          ))}
        </ScrollView>
        <View style={styles.row}>
          {state === 'ENDED' && (
            <View style={styles.button}>
              <Button
                color={'green'}
                style={styles.button}
                onPress={async () => {
                  await updateState('STARTED');
                }}
                title={'BEGIN JOURNEY'}
              />
            </View>
          )}
          {state === 'STARTED' && (
            <View style={styles.button}>
              <Button
                onPress={async () => {
                  await updateState('PAUSED');
                }}
                title={'TAKE A BREAK'}
              />
            </View>
          )}
          {state === 'PAUSED' && (
            <View style={styles.button}>
              <Button
                style={styles.button}
                onPress={async () => {
                  await updateState('STARTED');
                }}
                title={'BREAK THE BREAK'}
              />
            </View>
          )}
          {state !== 'ENDED' && (
            <View style={styles.button}>
              <Button
                style={styles.button}
                color={'red'}
                onPress={async () => {
                  Alert.alert('End of day', 'GO LIVE YOUR LIFE SIR.', [
                    {
                      text: 'Cancel',
                      style: 'cancel',
                    },
                    {
                      text: 'Proceed',
                      onPress: async () => {
                        await updateState('ENDED');
                        await reloadData();
                      },
                    },
                  ]);
                }}
                title={'END YOUR JOURNEY'}
              />
            </View>
          )}
          {state === 'ENDED' && (
            <View style={styles.button}>
              <Button
                color="red"
                style={styles.button}
                onPress={() => {
                  Alert.alert(
                    'Remove data',
                    'THIS ACTION WILL DELETE ALL DATA !!!',
                    [
                      {
                        text: 'Cancel',
                        style: 'cancel',
                      },
                      {
                        text: 'Proceed',
                        onPress: async () => {
                          await repository.clear();
                          await reloadData();
                        },
                      },
                    ],
                  );
                }}
                title={'CLEAR'}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    height: '100%',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 40 : 60,
    marginHorizontal: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  button: {
    marginBottom: 10,
  },
  statistics: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 2,
  },
  timer: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  worked: {
    color: 'green',
  },
  info: {
    color: 'blue',
  },
  break: {
    color: 'red',
  },
  table: {
    paddingTop: 10,
  },
  head: {
    paddingTop: 20,
  },
  tr: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 2,
  },
  th: {
    flex: 1,
    fontSize: 16,
  },
  tbody: {
    maxHeight: '50%',
  },
  td: {
    flex: 1,
    fontSize: 15,
  },
  history: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default Dashboard;
