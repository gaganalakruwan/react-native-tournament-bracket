import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BracketWithLines from '@gaganalakruwan/react-native-tournament-bracket';
import { sampleArray } from './sampleArray';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0D1E62' }}>
        <BracketWithLines
          data={sampleArray}
          trophySource={require('./trofi.png')}
          onMatchPress={(match) => {
            console.log('Match pressed:', match.id);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

export default App;
