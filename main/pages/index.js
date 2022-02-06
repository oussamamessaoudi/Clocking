import React from 'react';
import {Router, Scene} from 'react-native-router-flux';
import Dashboard from './Dashboard';
import Detail from './Detail';
import {Platform, StyleSheet} from 'react-native';

export default () => {
  return (
    <Router>
      <Scene
        key="root"
        navigationBarStyle={styles.header}
        titleStyle={styles.component}
        leftButtonIconStyle={styles.component}
        panHandlers={true}>
        <Scene
          key="dashboard"
          component={Dashboard}
          title="Let's Count ..."
          initial={true}
        />
        <Scene key="detail" component={Detail} title="By Date ..." />
      </Scene>
    </Router>
  );
};

const styles = StyleSheet.create({
  header: {
    height: Platform.OS === 'ios' ? 70 : 0,
  },
  component: {
    marginTop: Platform.OS === 'ios' ? 15 : 0,
  },
});
