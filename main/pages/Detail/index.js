import React, {useEffect, useState} from 'react';
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {repository} from '../../config/db';
import {formatDate, timeFormatter} from '../../config/helpers';

export default ({date}) => {
  const [data, setData] = useState([]);
  useEffect(() => {
    (async function () {
      setData(
        await repository.findByYearMonthDay(date.year, date.month, date.day),
      );
    })();
  }, [date]);
  return (
    <SafeAreaView>
      <StatusBar />
      <View style={styles.container}>
        <View style={[styles.tr, styles.head]}>
          <Text style={[styles.th, styles.timer]}>DATE</Text>
          <Text style={[styles.th, styles.info, styles.timer]}>
            {formatDate(date)}
          </Text>
        </View>
        <View style={[styles.tr, styles.head]}>
          <Text style={[styles.th, styles.timer]}>TIME</Text>
          <Text style={[styles.th, styles.timer]}>STATUS</Text>
        </View>
        <ScrollView style={styles.tbody}>
          {data.map((e, i) => (
            <View key={i} style={styles.tr}>
              <Text style={[styles.td]}>{timeFormatter(e)}</Text>
              <Text style={[styles.td, getClassName(e.state)]}>{e.state}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

function getClassName(state) {
  switch (state) {
    case 'STARTED':
      return styles.success;
    case 'PAUSED':
      return styles.warn;
    case 'ENDED':
      return styles.error;
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    height: '100%',
    marginTop: Platform.OS === 'ios' ? 30 : 60,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    marginHorizontal: 10,
  },
  timer: {
    fontWeight: 'bold',
  },
  success: {
    color: 'green',
  },
  error: {
    color: 'red',
  },
  warn: {
    color: 'orange',
  },
  info: {
    color: 'blue',
  },
  table: {
    paddingTop: 10,
  },
  head: {
    paddingTop: 10,
  },
  tr: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  th: {
    flex: 1,
  },
  tbody: {
    maxHeight: '100%',
  },
  td: {
    flex: 1,
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
