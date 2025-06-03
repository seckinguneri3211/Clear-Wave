import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import ToneGenerator from './components/ToneGenerator';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(165);
  const [duration, setDuration] = useState(30);
  const [intensity, setIntensity] = useState(1);
  const [progress, setProgress] = useState(0);
  
  const toneGenerator = useRef(new ToneGenerator()).current;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressTimer = useRef(null);
  const waveAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    setupAudio();
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
      toneGenerator.stop();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });
    } catch (error) {
      console.log('Audio setup error:', error);
    }
  };

  const startWaterEjection = async () => {
    if (isPlaying) {
      stopWaterEjection();
      return;
    }

    // Kullanıcı uyarısı
    Alert.alert(
      'Su Atma Başlatılıyor',
      'Telefonu hoparlör aşağıya gelecek şekilde tutun ve ses seviyesini maksimuma çıkarın.',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Başlat', onPress: () => startEjection() }
      ]
    );
  };

  const startEjection = async () => {
    setIsPlaying(true);
    setProgress(0);
    
    // Animasyonları başlat
    startWaveAnimations();
    startButtonAnimation();
    
    // Progress timer başlat
    const startTime = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progressValue = Math.min(elapsed / duration, 1);
      setProgress(progressValue);
      
      if (progressValue >= 1) {
        stopWaterEjection();
      }
    }, 100);

    // Tone generator ile ses çal
    try {
      const volume = getVolumeForIntensity(intensity);
      await toneGenerator.startFrequencyCycle(
        frequency, 
        2000, // High frequency
        duration * 1000, 
        volume
      );
    } catch (error) {
      console.log('Audio play error:', error);
      // Fallback: sadece görsel feedback
    }

    // Otomatik durdurma
    setTimeout(() => {
      if (isPlaying) {
        stopWaterEjection();
      }
    }, duration * 1000);
  };

  const stopWaterEjection = () => {
    setIsPlaying(false);
    setProgress(0);
    
    // Ses durdur
    toneGenerator.stop();

    // Timer temizle
    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }

    // Animasyonları durdur
    stopWaveAnimations();
    stopButtonAnimation();
  };

  const startWaveAnimations = () => {
    waveAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 300),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  };

  const stopWaveAnimations = () => {
    waveAnimations.forEach(anim => anim.stopAnimation());
  };

  const startButtonAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopButtonAnimation = () => {
    animatedValue.stopAnimation();
    animatedValue.setValue(0);
  };

  const getVolumeForIntensity = (level) => {
    switch (level) {
      case 0: return 0.3; // Low
      case 1: return 0.6; // Medium
      case 2: return 0.9; // High
      default: return 0.6;
    }
  };

  const getIntensityText = (level) => {
    switch (level) {
      case 0: return 'Düşük';
      case 1: return 'Orta';
      case 2: return 'Yüksek';
      default: return 'Orta';
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#0066CC', '#003366']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="water" size={40} color="white" />
          <Text style={styles.title}>Clear Wave</Text>
          <Text style={styles.subtitle}>Su Atma Sistemi</Text>
        </View>

        {/* Center Button with Waves */}
        <View style={styles.centerContainer}>
          {/* Wave Animations */}
          {isPlaying && (
            <View style={styles.wavesContainer}>
              {waveAnimations.map((anim, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.wave,
                    {
                      transform: [{
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.5, 4],
                        })
                      }],
                      opacity: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 0],
                      })
                    }
                  ]}
                />
              ))}
            </View>
          )}

          {/* Main Button */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                transform: [{
                  scale: animatedValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 0.95],
                  })
                }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.mainButton,
                { backgroundColor: isPlaying ? '#FF3333' : 'white' }
              ]}
              onPress={startWaterEjection}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="volume-high" 
                size={40} 
                color={isPlaying ? 'white' : '#0066CC'} 
              />
              <Text style={[
                styles.buttonText,
                { color: isPlaying ? 'white' : '#0066CC' }
              ]}>
                {isPlaying ? 'DURDUR' : 'SU AT'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {/* Frequency */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Frekans: {Math.round(frequency)}Hz</Text>
            <Slider
              style={styles.slider}
              minimumValue={165}
              maximumValue={2000}
              value={frequency}
              onValueChange={setFrequency}
              minimumTrackTintColor="#00CCFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbStyle={styles.sliderThumb}
              disabled={isPlaying}
            />
          </View>

          {/* Duration */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Süre: {Math.round(duration)}s</Text>
            <Slider
              style={styles.slider}
              minimumValue={30}
              maximumValue={120}
              value={duration}
              onValueChange={setDuration}
              minimumTrackTintColor="#00CCFF"
              maximumTrackTintColor="rgba(255,255,255,0.3)"
              thumbStyle={styles.sliderThumb}
              disabled={isPlaying}
            />
          </View>

          {/* Intensity */}
          <View style={styles.controlGroup}>
            <Text style={styles.controlLabel}>Yoğunluk: {getIntensityText(intensity)}</Text>
            <View style={styles.intensityContainer}>
              {[0, 1, 2].map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.intensityButton,
                    { backgroundColor: intensity === level ? '#00CCFF' : 'rgba(255,255,255,0.2)' }
                  ]}
                  onPress={() => setIntensity(level)}
                  disabled={isPlaying}
                >
                  <Text style={[
                    styles.intensityText,
                    { color: intensity === level ? 'white' : 'rgba(255,255,255,0.8)' }
                  ]}>
                    {getIntensityText(level)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Progress */}
          {isPlaying && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}% - {Math.round((1 - progress) * duration)}s kaldı
              </Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.infoText}>💧 Telefonu hoparlör tarafı aşağı gelecek şekilde tutun</Text>
          <Text style={styles.infoText}>🔊 Ses seviyesini maksimuma çıkarın</Text>
          <Text style={styles.infoText}>⚡ Apple Watch benzeri frekans teknolojisi</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  wavesContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#00CCFF',
  },
  buttonContainer: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  mainButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlGroup: {
    marginBottom: 20,
  },
  controlLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: '#00CCFF',
    width: 20,
    height: 20,
  },
  intensityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  intensityButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  intensityText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00CCFF',
    borderRadius: 3,
  },
  progressText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
  },
  info: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  infoText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});
