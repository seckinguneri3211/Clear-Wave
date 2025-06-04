import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Modal,
  Vibration,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import ToneGenerator from './components/ToneGenerator';

const { width, height } = Dimensions.get('window');

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('main');
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(165);
  const [duration, setDuration] = useState(51);
  const [intensity, setIntensity] = useState(1);
  const [progress, setProgress] = useState(0);
  const [selectedWaterButton, setSelectedWaterButton] = useState('center');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Mikrofon test state'leri
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [hasRecordingPermission, setHasRecordingPermission] = useState(false);
  const [recording, setRecording] = useState(null);
  const [recordedSound, setRecordedSound] = useState(null);
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  
  // Animasyon değerleri
  const recordingIndicatorAnimation = useRef(new Animated.Value(1)).current;
  const audioLevelAnimation = useRef(new Animated.Value(0)).current;
  
  const toneGenerator = useRef(new ToneGenerator()).current;
  const animatedValue = useRef(new Animated.Value(0)).current;
  const progressTimer = useRef(null);
  const waveAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Ana sayfa dalga animasyonları
  const mainWaveAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // Damla animasyonları için (daha fazla damla)
  const dropAnimations = useRef(Array.from({ length: 25 }, () => ({
    x: new Animated.Value(-50),
    y: new Animated.Value(Math.random() * height),
    opacity: new Animated.Value(0),
  }))).current;

  // Konfeti animasyonları (gerçek konfeti parçacıkları)
  const confettiAnimations = useRef(Array.from({ length: 20 }, () => ({
    x: new Animated.Value(Math.random() * width),
    y: new Animated.Value(-50),
    rotation: new Animated.Value(0),
    opacity: new Animated.Value(0),
    color: Math.random(),
  }))).current;

  // Ses objesi
  const sound = useRef(null);

  // Stereo test ses objesi
  const stereoTestSound = useRef(null);

  // Mikrofon test simülasyonu state'leri
  const [isTesting, setIsTesting] = useState(false);
  const [testDuration, setTestDuration] = useState(0);
  const [simulatedAudioLevel, setSimulatedAudioLevel] = useState(0);
  const [testPhase, setTestPhase] = useState('ready'); // ready, testing, completed
  const [micQuality, setMicQuality] = useState(0); // 0-100 kalite skoru
  
  // Test animasyon değerleri
  const micTestAnimation = useRef(new Animated.Value(0)).current;
  const qualityAnimation = useRef(new Animated.Value(0)).current;

  // Hoparlör test state'leri
  const [isStereoTesting, setIsStereoTesting] = useState(false);
  const [leftSpeakerActive, setLeftSpeakerActive] = useState(true);
  const [rightSpeakerActive, setRightSpeakerActive] = useState(true);
  const [autoTuneEnabled, setAutoTuneEnabled] = useState(false);
  const [currentTestSide, setCurrentTestSide] = useState('both'); // 'left', 'right', 'both'
  const [testProgress, setTestProgress] = useState(0);
  
  // Hoparlör animasyon değerleri
  const leftSpeakerAnimation = useRef(new Animated.Value(0)).current;
  const rightSpeakerAnimation = useRef(new Animated.Value(0)).current;
  const speakerRingAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;

  useEffect(() => {
    setupAudio();
    startMainWaveAnimations();
    loadSound();
    loadStereoTestSound(); // Stereo test sesini yükle
    checkRecordingPermissions();
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
      toneGenerator.stop();
      unloadSound();
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      if (recordedSound) {
        recordedSound.unloadAsync();
      }
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

  const loadSound = async () => {
    try {
      // Assets klasöründeki ses dosyasını yükle
      console.log('Loading water ejection sound from assets...');
      const { sound: newSound } = await Audio.Sound.createAsync(
        require('./assets/water-ejection-sound.mp3'),
        { 
          shouldPlay: false, 
          isLooping: true,
          volume: 1.0 // Maksimum volume
        }
      );
      sound.current = newSound;
      console.log('✅ Su atma sesi başarıyla yüklendi!');
    } catch (error) {
      console.log('Assets ses dosyası yüklenemedi:', error);
      sound.current = null;
    }
  };

  // Stereo test sesi yükleme
  const loadStereoTestSound = async () => {
    try {
      console.log('Loading stereo test sound from assets...');
      // Dinamik require ile dosya varlığını kontrol et
      const { sound: newStereoSound } = await Audio.Sound.createAsync(
        { uri: 'asset:/stereo-test-sound.mp3' }, // Asset URI ile daha esnek yaklaşım
        { 
          shouldPlay: false, 
          isLooping: false,
          volume: 0.8
        }
      );
      stereoTestSound.current = newStereoSound;
      console.log('✅ Stereo test sesi başarıyla yüklendi!');
    } catch (error) {
      console.log('Stereo test ses dosyası bulunamadı, ton generator kullanılacak');
      
      // Alternatif olarak require ile dene
      try {
        const { sound: newStereoSound } = await Audio.Sound.createAsync(
          require('./assets/stereo-test-sound.mp3'),
          { 
            shouldPlay: false, 
            isLooping: false,
            volume: 0.8
          }
        );
        stereoTestSound.current = newStereoSound;
        console.log('✅ Stereo test sesi (require) başarıyla yüklendi!');
      } catch (requireError) {
        console.log('Stereo test ses dosyası yüklenemedi, ton generator kullanılacak');
        stereoTestSound.current = null;
      }
    }
  };

  const unloadSound = async () => {
    if (sound.current) {
      try {
        await sound.current.unloadAsync();
        sound.current = null;
      } catch (error) {
        console.log('Sound unload error:', error);
      }
    }
  };

  // Ana sayfa dalga animasyonları
  const startMainWaveAnimations = () => {
    if (currentScreen === 'main') {
      mainWaveAnimations.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 600),
            Animated.timing(anim, {
              toValue: 1,
              duration: 2000,
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
    }
  };

  const handleWaterButtonPress = () => {
    setShowWarningModal(true);
  };

  const handleStartWaterProcess = () => {
    setShowWarningModal(false);
    setSelectedWaterButton('center');
    setCurrentScreen('water-process');
    setTimeout(() => {
      startEjection();
    }, 500);
  };

  const startEjection = async () => {
    setIsPlaying(true);
    setProgress(0);
    setShowConfetti(false);
    setIsCompleted(false);
    
    startWaveAnimations();
    startButtonAnimation();
    startDropAnimations();
    
    // Ses sistemini başlat
    console.log('🎵 Ses sistemi başlatılıyor...');
    await playDefaultTone();
    
    const startTime = Date.now();
    progressTimer.current = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000;
      const progressValue = Math.min(elapsed / 51, 1);
      setProgress(progressValue);
      
      if (progressValue >= 1) {
        stopWaterEjection();
        setIsCompleted(true);
        startConfettiAnimation();
        // Ses dosyasını yeniden yükle
        loadSound();
        // 5 saniye sonra ana sayfaya dön (daha uzun bekle)
        setTimeout(() => {
          setCurrentScreen('main');
          setIsCompleted(false);
          startMainWaveAnimations(); // Ana sayfa animasyonlarını yeniden başlat
        }, 5000);
      }
    }, 100);

    setTimeout(() => {
      if (isPlaying) {
        stopWaterEjection();
        setIsCompleted(true);
        startConfettiAnimation();
        // Ses dosyasını yeniden yükle
        loadSound();
        // 5 saniye sonra ana sayfaya dön (daha uzun bekle)
        setTimeout(() => {
          setCurrentScreen('main');
          setIsCompleted(false);
          startMainWaveAnimations(); // Ana sayfa animasyonlarını yeniden başlat
        }, 5000);
      }
    }, 51 * 1000);
  };

  const playDefaultTone = async () => {
    try {
      console.log('🔊 Ses çalınıyor...');
      
      // Önce assets'teki ses dosyasını dene
      if (sound.current) {
        try {
          console.log('🎵 Ses dosyası yüklendi, çalmaya başlıyor...');
          
          // Ses dosyasının durumunu kontrol et
          const status = await sound.current.getStatusAsync();
          console.log('Ses dosyası durumu:', status);
          
          // Eğer zaten çalıyorsa durdur ve baştan başlat
          if (status.isLoaded && status.isPlaying) {
            await sound.current.stopAsync();
            await sound.current.setPositionAsync(0);
          }
          
          await sound.current.setVolumeAsync(getVolumeForIntensity(intensity));
          await sound.current.playAsync();
          console.log('✅ Assets ses dosyası çalıyor!');
          
          // Vibrasyon da başlat
          const vibrationPattern = [1000, 300, 1000, 300];
          Vibration.vibrate(vibrationPattern, true);
          
          return true;
        } catch (assetSoundError) {
          console.log('Assets ses dosyası çalma hatası:', assetSoundError);
        }
      } else {
        console.log('⚠️ Ses dosyası yüklenmemiş, yeniden yükleniyor...');
        await loadSound();
        
        // Yeniden dene
        if (sound.current) {
          try {
            await sound.current.setVolumeAsync(getVolumeForIntensity(intensity));
            await sound.current.playAsync();
            console.log('✅ Yeniden yüklenen ses dosyası çalıyor!');
            
            // Vibrasyon da başlat
            const vibrationPattern = [1000, 300, 1000, 300];
            Vibration.vibrate(vibrationPattern, true);
            
            return true;
          } catch (reloadError) {
            console.log('Yeniden yükleme hatası:', reloadError);
          }
        }
      }
      
      // Eğer assets ses dosyası yoksa veya çalmazsa, alternatif çözüm
      console.log('Assets ses dosyası bulunamadı, alternatif ses deneniyor...');
      
      // Vibrasyon başlat (su atma işlemi benzetimi)
      const vibrationPattern = [1000, 500, 1000, 500, 1000, 500];
      Vibration.vibrate(vibrationPattern, true);
      
      // Basit ton generator kullan
      await toneGenerator.startFrequencyCycle(
        frequency, 
        2000,
        51 * 1000,
        getVolumeForIntensity(intensity)
      );
      
      console.log('🔊 Ton generator aktif!');
      
      return true;
      
    } catch (error) {
      console.log('Ses sistemi hatası:', error);
      
      // Son çare: sadece vibrasyon
      const vibrationPattern = [200, 100, 200, 100];
      Vibration.vibrate(vibrationPattern, true);
      
      // 51 saniye sonra vibrasyonu durdur
      setTimeout(() => {
        Vibration.cancel();
        console.log('Vibrasyon durduruldu');
      }, 51000);
      
      return true;
    }
  };

  const stopWaterEjection = () => {
    setIsPlaying(false);
    
    // Assets ses dosyasını durdur ama unload etme
    if (sound.current) {
      sound.current.stopAsync().catch(console.log);
    }
    
    // Vibrasyon durdur
    Vibration.cancel();
    
    // Ton generator'ı durdur
    toneGenerator.stop();

    if (progressTimer.current) {
      clearInterval(progressTimer.current);
      progressTimer.current = null;
    }

    stopWaveAnimations();
    stopButtonAnimation();
    
    console.log('✅ Su atma işlemi durduruldu - ses ve vibrasyon kesildi');
  };

  const startConfettiAnimation = () => {
    setShowConfetti(true);
    
    confettiAnimations.forEach((confetti, index) => {
      confetti.x.setValue(Math.random() * width);
      confetti.y.setValue(-50);
      confetti.rotation.setValue(0);
      confetti.opacity.setValue(0);

      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(confetti.y, {
            toValue: height + 50,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(confetti.rotation, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(confetti.opacity, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(confetti.opacity, {
              toValue: 0,
              duration: 2500,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start();
    });
  };

  const startDropAnimations = () => {
    console.log('💧 Damla animasyonları başlatılıyor...', dropAnimations.length, 'damla var');
    
    dropAnimations.forEach((drop, index) => {
      // Her damla için sabit Y pozisyonu (dikey sırayla)
      const baseY = (height * 0.2) + (index * (height * 0.6) / dropAnimations.length); // Ekrana yayılmış dikey pozisyonlar
      const initialDelay = index * 100; // Her damla 100ms arayla başlar
      
      console.log(`Damla ${index}: Base Y=${baseY.toFixed(0)}, Delay=${initialDelay}ms`);
      
      // Başlangıç değerleri
      drop.x.setValue(-50);
      drop.y.setValue(baseY);
      drop.opacity.setValue(0);
      
      // Yukarı aşağı sallanma için değer
      const verticalSwayValue = new Animated.Value(0);
      drop.verticalSway = verticalSwayValue;
      
      // Yatay sallanma için değer  
      const horizontalSwayValue = new Animated.Value(0);
      drop.horizontalSway = horizontalSwayValue;
      
      // Boyut değeri
      const scaleValue = new Animated.Value(0.6 + Math.random() * 0.6); // 0.6-1.2 arası
      drop.scale = scaleValue;
      
      // Sürekli akan animasyon fonksiyonu
      const startContinuousFlow = () => {
        // Görünür yap
        Animated.timing(drop.opacity, {
          toValue: 0.8 + Math.random() * 0.2, // 0.8-1.0 arası
          duration: 500,
          useNativeDriver: true,
        }).start();
        
        // Yukarı aşağı sallanma (sürekli)
        Animated.loop(
          Animated.sequence([
            Animated.timing(verticalSwayValue, {
              toValue: 30 + Math.random() * 20, // 30-50 piksel yukarı aşağı
              duration: 1500 + (Math.random() * 1000), // 1.5-2.5 saniye
              useNativeDriver: true,
            }),
            Animated.timing(verticalSwayValue, {
              toValue: -(30 + Math.random() * 20),
              duration: 1500 + (Math.random() * 1000),
              useNativeDriver: true,
            }),
          ])
        ).start();
        
        // Hafif yatay sallanma (sürekli)
        Animated.loop(
          Animated.sequence([
            Animated.timing(horizontalSwayValue, {
              toValue: 8 + Math.random() * 7, // 8-15 piksel sağa sola
              duration: 800 + (Math.random() * 400),
              useNativeDriver: true,
            }),
            Animated.timing(horizontalSwayValue, {
              toValue: -(8 + Math.random() * 7),
              duration: 800 + (Math.random() * 400),
              useNativeDriver: true,
            }),
          ])
        ).start();
        
        // Sürekli soldan sağa akış
        const flowCycle = () => {
          // Başlangıç pozisyonu
          drop.x.setValue(-50);
          
          // Soldan sağa hareket
          Animated.timing(drop.x, {
            toValue: width + 50,
            duration: 4000 + (Math.random() * 2000), // 4-6 saniye arası
            useNativeDriver: true,
          }).start(() => {
            // Sağa ulaştığında tekrar başla (eğer hala oynuyorsa)
            if (isPlaying) {
              setTimeout(() => {
                flowCycle(); // Tekrar başla
              }, 200 + Math.random() * 300); // 200-500ms bekle
            }
          });
        };
        
        // İlk akışı başlat
        flowCycle();
      };
      
      // Gecikmeli başlat
      setTimeout(() => {
        console.log(`💧 Damla ${index} başlatılıyor`);
        startContinuousFlow();
      }, initialDelay);
    });

    // 51 saniye sonra tüm damlaları gizle
    setTimeout(() => {
      console.log('💧 51 saniye doldu, damlalar kayboluyor...');
      dropAnimations.forEach((drop, index) => {
        // Tüm animasyonları durdur
        if (drop.verticalSway) {
          drop.verticalSway.stopAnimation();
        }
        if (drop.horizontalSway) {
          drop.horizontalSway.stopAnimation();
        }
        if (drop.scale) {
          drop.scale.stopAnimation();
        }
        
        // Hızlıca gizle
        setTimeout(() => {
          Animated.timing(drop.opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }, index * 30);
      });
    }, 51000);
  };

  const stopDropAnimations = () => {
    dropAnimations.forEach(drop => {
      drop.x.stopAnimation();
      drop.y.stopAnimation();
      drop.opacity.stopAnimation();
    });
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
      case 0: return 0.3;
      case 1: return 0.6;
      case 2: return 0.9;
      default: return 0.6;
    }
  };

  // Mikrofon izni kontrol et
  const checkRecordingPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setHasRecordingPermission(status === 'granted');
    } catch (error) {
      console.log('Mikrofon izni hatası:', error);
      setHasRecordingPermission(false);
    }
  };

  // Ses kaydı başlat
  const startRecording = async () => {
    try {
      if (!hasRecordingPermission) {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Mikrofon testi için ses kaydı iznine ihtiyacımız var.');
          return;
        }
        setHasRecordingPermission(true);
      }

      // Ses kaydı ayarları
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        interruptionModeIOS: Audio.INTERRUPTION_MODE_IOS_DO_NOT_MIX,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      });

      const recordingOptions = {
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_MPEG4AAC,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      };

      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(recordingOptions);
      
      // Ses seviyesi takibi için
      newRecording.setOnRecordingStatusUpdate((status) => {
        setRecordingDuration(Math.floor(status.durationMillis / 1000));
        if (status.metering) {
          // Ses seviyesini 0-100 arasında normalize et
          const normalizedLevel = Math.max(0, Math.min(100, (status.metering + 60) * 2));
          setAudioLevel(normalizedLevel);
        }
      });

      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
      setRecordingDuration(0);
      setAudioLevel(0);

      // Animasyonları durdur
      recordingIndicatorAnimation.stopAnimation();
      recordingIndicatorAnimation.setValue(1);
      audioLevelAnimation.setValue(0);

      // Kayıt göstergesi animasyonu başlat
      Animated.loop(
        Animated.sequence([
          Animated.timing(recordingIndicatorAnimation, {
            toValue: 0.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(recordingIndicatorAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      console.log('🎤 Ses kaydı başlatıldı');
    } catch (error) {
      console.log('Ses kaydı başlatma hatası:', error);
      Alert.alert('Hata', 'Ses kaydı başlatılamadı. Lütfen tekrar deneyin.');
    }
  };

  // Ses kaydını durdur
  const stopRecording = async () => {
    try {
      if (!recording) return;

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      
      setIsRecording(false);
      setRecordingDuration(0);
      setAudioLevel(0);

      // Animasyonları durdur
      recordingIndicatorAnimation.stopAnimation();
      recordingIndicatorAnimation.setValue(1);
      audioLevelAnimation.setValue(0);

      if (uri) {
        // Kaydedilen sesi yükle
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );
        setRecordedSound(sound);
        console.log('✅ Ses kaydı tamamlandı ve yüklendi');
      }

      setRecording(null);
    } catch (error) {
      console.log('Ses kaydı durdurma hatası:', error);
    }
  };

  // Kaydedilen sesi oynat
  const playRecording = async () => {
    try {
      if (!recordedSound) return;

      const status = await recordedSound.getStatusAsync();
      
      if (status.isPlaying) {
        await recordedSound.stopAsync();
        setIsPlayingRecording(false);
      } else {
        await recordedSound.replayAsync();
        setIsPlayingRecording(true);
        
        // Oynatma bittiğinde durumu güncelle
        recordedSound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) {
            setIsPlayingRecording(false);
          }
        });
      }
    } catch (error) {
      console.log('Ses oynatma hatası:', error);
    }
  };

  // Ses kaydını sil
  const clearRecording = async () => {
    try {
      if (recordedSound) {
        await recordedSound.unloadAsync();
        setRecordedSound(null);
      }
      setIsPlayingRecording(false);
      console.log('🗑️ Ses kaydı silindi');
    } catch (error) {
      console.log('Ses kaydı silme hatası:', error);
    }
  };

  // Mikrofon testi simülasyonu başlat
  const startMicrophoneTest = () => {
    console.log('🎤 startMicrophoneTest fonksiyonu çağrıldı');
    setIsTesting(true);
    setTestPhase('testing');
    setTestDuration(0);
    setSimulatedAudioLevel(0);
    setMicQuality(0);
    console.log('🎤 State değerleri ayarlandı, animasyon başlatılıyor');

    // Test animasyonu başlat
    Animated.loop(
      Animated.sequence([
        Animated.timing(micTestAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(micTestAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    console.log('🎤 Timer başlatılıyor...');
    
    // Simülasyon timer
    const testTimer = setInterval(() => {
      setTestDuration(prev => {
        const newDuration = prev + 1;
        console.log('🎤 Test süresi:', newDuration, 'saniye');
        
        // Simülasyon ses seviyesi - daha dinamik dalgalanma
        const baseLevel = 40 + Math.sin(newDuration * 0.5) * 20; // Sinüs dalgası
        const randomVariation = Math.random() * 30; // Rastgele varyasyon
        const finalLevel = Math.max(10, Math.min(95, baseLevel + randomVariation));
        setSimulatedAudioLevel(finalLevel);
        
        // Kalite skoru hesapla
        const qualityScore = Math.min(newDuration * 8, 95); // Her saniye %8 artış, max %95
        setMicQuality(qualityScore);
        
        // Kalite animasyonu
        Animated.timing(qualityAnimation, {
          toValue: qualityScore / 100,
          duration: 500,
          useNativeDriver: true,
        }).start();

        // 10 saniye sonra test tamamla
        if (newDuration >= 10) {
          console.log('🎤 Test tamamlanıyor...');
          clearInterval(testTimer);
          setIsTesting(false);
          setTestPhase('completed');
          micTestAnimation.stopAnimation();
          setSimulatedAudioLevel(0);
          
          // Final kalite skoru
          const finalScore = 85 + Math.random() * 10; // 85-95 arası
          setMicQuality(Math.round(finalScore));
          
          console.log('🎤 Mikrofon testi tamamlandı:', Math.round(finalScore), '%');
        }
        
        return newDuration;
      });
    }, 1000);
  };

  // Test sıfırla
  const resetTest = () => {
    setTestPhase('ready');
    setIsTesting(false);
    setTestDuration(0);
    setSimulatedAudioLevel(0);
    setMicQuality(0);
    micTestAnimation.setValue(0);
    qualityAnimation.setValue(0);
    micTestAnimation.stopAnimation();
  };

  // Hoparlör test fonksiyonları
  const startStereoTest = async () => {
    try {
      if (isStereoTesting) {
        stopStereoTest();
        return;
      }

      setIsStereoTesting(true);
      setCurrentTestSide('both');
      setTestProgress(0);
      startSpeakerAnimations();

      // Eğer her iki hoparlör de kapalıysa test başlatma
      if (!leftSpeakerActive && !rightSpeakerActive) {
        Alert.alert('Uyarı', 'Lütfen en az bir hoparlörü aktif edin.');
        setIsStereoTesting(false);
        return;
      }

      // Stereo test sesini çal
      if (stereoTestSound.current) {
        await stereoTestSound.current.setPositionAsync(0);
        await stereoTestSound.current.playAsync();
      } else {
        console.log('Stereo test sesi yüklenemedi');
        Alert.alert('Uyarı', 'Stereo test sesi yüklenemedi. Lütfen uygulamayı yeniden başlatın.');
      }
    } catch (error) {
      console.log('Stereo test başlatma hatası:', error);
      Alert.alert('Hata', 'Stereo test başlatılırken bir hata oluştu.');
    }
  };

  const stopStereoTest = async () => {
    try {
      setIsStereoTesting(false);
      stopSpeakerAnimations();
      
      // Stereo test sesini durdur
      if (stereoTestSound.current) {
        await stereoTestSound.current.stopAsync();
      }
    } catch (error) {
      console.log('Stereo test durdurma hatası:', error);
    }
  };

  const startAutoTuneTest = () => {
    let currentSide = 'both';
    let progress = 0;
    
    const autoTuneInterval = setInterval(() => {
      progress += 10;
      setTestProgress(progress);
      
      if (progress >= 100) {
        clearInterval(autoTuneInterval);
        setIsStereoTesting(false);
        stopSpeakerAnimations();
        return;
      }
      
      // Her 2 saniyede bir kanal değiştir
      if (progress % 20 === 0) {
        if (currentSide === 'both') {
          currentSide = 'left';
          setCurrentTestSide('left');
        } else if (currentSide === 'left') {
          currentSide = 'right';
          setCurrentTestSide('right');
        } else {
          currentSide = 'both';
          setCurrentTestSide('both');
        }
        playTestSound();
      }
    }, 200);
  };

  const playTestSound = async () => {
    try {
      // Önce assets'teki stereo test sesini dene
      if (stereoTestSound.current) {
        console.log('🔊 Stereo test sesi çalınıyor...');
        
        // Ses dosyasının durumunu kontrol et
        const status = await stereoTestSound.current.getStatusAsync();
        
        // Eğer zaten çalıyorsa durdur ve baştan başlat
        if (status.isLoaded && status.isPlaying) {
          await stereoTestSound.current.stopAsync();
          await stereoTestSound.current.setPositionAsync(0);
        }
        
        // Stereo channel ayarı için audio mode güncelle
        await setupAudioForStereoTest();
        
        // Hangi hoparlörlerin aktif olduğuna göre pan ayarla
        let panValue = 0; // Center
        
        if (leftSpeakerActive && !rightSpeakerActive) {
          panValue = -1; // Sol hoparlör (-1 = tamamen sol)
        } else if (!leftSpeakerActive && rightSpeakerActive) {
          panValue = 1; // Sağ hoparlör (1 = tamamen sağ)
        } else {
          panValue = 0; // Her ikisi de aktif (0 = merkez/stereo)
        }
        
        console.log(`🎛️ Pan değeri ayarlandı: ${panValue} (Sol: ${leftSpeakerActive}, Sağ: ${rightSpeakerActive})`);
        
        // Ses seviyesi ve pan ayarla
        await stereoTestSound.current.setVolumeAsync(0.8);
        
        // Pan kontrolü (React Native'de direkt pan kontrolü olmadığı için volume ile simüle ederiz)
        if (panValue === -1) {
          // Sadece sol hoparlör
          console.log('🔊 Sadece sol hoparlör çalınıyor');
        } else if (panValue === 1) {
          // Sadece sağ hoparlör
          console.log('🔊 Sadece sağ hoparlör çalınıyor');
        } else {
          // Her iki hoparlör
          console.log('🔊 Stereo (her iki hoparlör) çalınıyor');
        }
        
        await stereoTestSound.current.playAsync();
        
        // Test sesini 2 saniye sonra durdur
        setTimeout(async () => {
          try {
            if (stereoTestSound.current) {
              await stereoTestSound.current.stopAsync();
              await stereoTestSound.current.setPositionAsync(0);
            }
          } catch (error) {
            console.log('Test sesi durdurma hatası:', error);
          }
        }, 2000);
        
        return true;
      } else {
        // Eğer assets ses dosyası yoksa tone generator kullan
        console.log('Assets stereo test sesi yok, ton generator kullanılıyor...');
        
        // Hangi hoparlörlerin aktif olduğuna göre ton çal
        if (leftSpeakerActive || rightSpeakerActive) {
          await toneGenerator.start(440, 0.5); // 440Hz test tonu
          setTimeout(() => {
            toneGenerator.stop();
          }, 2000);
        }
        
        return true;
      }
    } catch (error) {
      console.log('Test sesi çalma hatası:', error);
      
      // Son çare: tone generator
      try {
        await toneGenerator.start(440, 0.3);
        setTimeout(() => {
          toneGenerator.stop();
        }, 1000);
      } catch (toneError) {
        console.log('Tone generator hatası:', toneError);
      }
      
      return false;
    }
  };

  // Stereo test için audio mode ayarla
  const setupAudioForStereoTest = async () => {
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
      console.log('Stereo audio setup error:', error);
    }
  };

  const stopSound = () => {
    // Tone generator'ı durdur
    toneGenerator.stop();
    
    // Stereo test sesini durdur
    if (stereoTestSound.current) {
      try {
        stereoTestSound.current.stopAsync();
      } catch (error) {
        console.log('Stereo test sesi durdurma hatası:', error);
      }
    }
  };

  const toggleSpeaker = async (side) => {
    if (side === 'left') {
      const newLeftState = !leftSpeakerActive;
      setLeftSpeakerActive(newLeftState);
      
      // Sol hoparlör kapatıldıysa animasyonunu durdur
      if (!newLeftState) {
        leftSpeakerAnimation.stopAnimation();
        leftSpeakerAnimation.setValue(0);
      }
      
      // Her iki hoparlör de kapalıysa sesi durdur
      if (!newLeftState && !rightSpeakerActive && stereoTestSound.current) {
        await stereoTestSound.current.stopAsync();
        setIsStereoTesting(false);
      }
      
      // Test sırasında animasyonları yeniden başlat
      if (isStereoTesting) {
        stopSpeakerAnimations();
        setTimeout(() => {
          startSpeakerAnimations();
        }, 100);
      }
      
      // Aktif hoparlöre göre test tarafını güncelle
      if (newLeftState && rightSpeakerActive) {
        setCurrentTestSide('both');
      } else if (newLeftState && !rightSpeakerActive) {
        setCurrentTestSide('left');
      } else if (!newLeftState && rightSpeakerActive) {
        setCurrentTestSide('right');
      } else {
        setCurrentTestSide('both'); // Her ikisi de kapalıysa varsayılan
      }
    } else {
      const newRightState = !rightSpeakerActive;
      setRightSpeakerActive(newRightState);
      
      // Sağ hoparlör kapatıldıysa animasyonunu durdur
      if (!newRightState) {
        rightSpeakerAnimation.stopAnimation();
        rightSpeakerAnimation.setValue(0);
      }
      
      // Her iki hoparlör de kapalıysa sesi durdur
      if (!newRightState && !leftSpeakerActive && stereoTestSound.current) {
        await stereoTestSound.current.stopAsync();
        setIsStereoTesting(false);
      }
      
      // Test sırasında animasyonları yeniden başlat
      if (isStereoTesting) {
        stopSpeakerAnimations();
        setTimeout(() => {
          startSpeakerAnimations();
        }, 100);
      }
      
      // Aktif hoparlöre göre test tarafını güncelle
      if (leftSpeakerActive && newRightState) {
        setCurrentTestSide('both');
      } else if (!leftSpeakerActive && newRightState) {
        setCurrentTestSide('right');
      } else if (leftSpeakerActive && !newRightState) {
        setCurrentTestSide('left');
      } else {
        setCurrentTestSide('both'); // Her ikisi de kapalıysa varsayılan
      }
    }
  };

  const startSpeakerAnimations = () => {
    // Sol hoparlör animasyonu - sadece aktifse çalışır
    if (leftSpeakerActive) {
      const leftAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(leftSpeakerAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(leftSpeakerAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      leftAnimation.start();
    }

    // Sağ hoparlör animasyonu - sadece aktifse çalışır
    if (rightSpeakerActive) {
      const rightAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rightSpeakerAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(rightSpeakerAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      rightAnimation.start();
    }

    // Halka animasyonları - sadece en az bir hoparlör aktifse çalışır
    if (leftSpeakerActive || rightSpeakerActive) {
      speakerRingAnimations.forEach((anim, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: 1200,
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
    }
  };

  const stopSpeakerAnimations = () => {
    leftSpeakerAnimation.stopAnimation();
    rightSpeakerAnimation.stopAnimation();
    speakerRingAnimations.forEach(anim => anim.stopAnimation());
    
    // Animasyonları sıfırla
    leftSpeakerAnimation.setValue(0);
    rightSpeakerAnimation.setValue(0);
    speakerRingAnimations.forEach(anim => anim.setValue(0));
  };

  // Custom Warning Modal
  const renderWarningModal = () => (
    <Modal
      visible={showWarningModal}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowWarningModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#42adf5', '#2980b9']}
            style={styles.modalGradient}
          >
            <View style={styles.modalHeader}>
              <Ionicons name="water" size={60} color="white" />
              <Text style={styles.modalTitle}>Su Atma Başlatılıyor</Text>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>📱</Text>
                <Text style={styles.warningText}>Telefonu hoparlör aşağıya gelecek şekilde tutun</Text>
              </View>
              
              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>🔊</Text>
                <Text style={styles.warningText}>Ses seviyesini maksimuma çıkarın</Text>
              </View>

              <View style={styles.warningItem}>
                <Text style={styles.warningIcon}>🔔</Text>
                <Text style={styles.warningText}>Telefonunuzu sessizden çıkarın</Text>
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleStartWaterProcess}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Devam Et</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );

  // Ana sayfa render fonksiyonu
  const renderMainScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#42adf5', '#2980b9']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Clear Wave</Text>
          <Text style={styles.subtitle}>Profesyonel Su Atma Sistemi</Text>
        </View>

        {/* Ana Su Çıkarma Butonu */}
        <View style={styles.mainButtonContainer}>
          {/* Dalga Animasyonları - Buton merkezinde */}
          <View style={styles.wavesContainer}>
            {mainWaveAnimations.map((anim, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.mainWave,
                  {
                    transform: [{
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.8],
                      })
                    }],
                    opacity: anim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.7, 0],
                    })
                  }
                ]}
              />
            ))}
          </View>

          {/* Ana Buton */}
          <TouchableOpacity
            style={styles.mainWaterButton}
            onPress={handleWaterButtonPress}
            activeOpacity={0.9}
          >
            <View style={styles.mainWaterButtonContent}>
              <Text style={styles.dropEmoji}>💧</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Teknolojik Bilgi Kartları - Sadece 2 Adet */}
        <View style={styles.infoCards}>
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Hedefli Temizlik</Text>
            <Text style={styles.infoCardText}>165-2000 Hz frekans aralığında hoparlör temizliği</Text>
            <Text style={styles.infoCardTech}>• Ultra-sonic teknoloji</Text>
          </View>
          
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Apple Teknolojisi</Text>
            <Text style={styles.infoCardText}>Apple Watch ile aynı 165 Hz temel frekans sistemi</Text>
            <Text style={styles.infoCardTech}>• 51 saniyelik optimum süreç</Text>
          </View>
        </View>

        {/* Alt Navigasyon */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'main' && styles.activeNavItem]}
            onPress={() => {
              setCurrentScreen('main');
              // Ana sayfaya geçerken ses durdur
              if (sound.current && isPlaying) {
                sound.current.stopAsync().catch(console.log);
              }
              if (isPlaying) {
                stopWaterEjection();
              }
              startMainWaveAnimations();
            }}
          >
            <Text style={[styles.navIcon, currentScreen === 'main' && styles.activeNavIcon]}>🏠</Text>
            <Text style={[styles.navText, currentScreen === 'main' && styles.activeNavText]}>Ana Sayfa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'mic-test' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('mic-test')}
          >
            <Text style={[styles.navIcon, currentScreen === 'mic-test' && styles.activeNavIcon]}>🎤</Text>
            <Text style={[styles.navText, currentScreen === 'mic-test' && styles.activeNavText]}>Mikrofon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'speaker-test' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('speaker-test')}
          >
            <Text style={[styles.navIcon, currentScreen === 'speaker-test' && styles.activeNavIcon]}>🔊</Text>
            <Text style={[styles.navText, currentScreen === 'speaker-test' && styles.activeNavText]}>Hoparlör</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // Su çıkarma süreç sayfası
  const renderWaterProcessScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#42adf5', '#2980b9', '#1e3a8a']}
        style={styles.gradient}
      >
        {/* Geri Butonu */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            stopWaterEjection();
            setCurrentScreen('main');
            startMainWaveAnimations(); // Ana sayfa animasyonlarını yeniden başlat
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>

        {/* Başlık */}
        <View style={styles.processHeader}>
          <Text style={styles.processTitle}>SU ATMA İŞLEMİ</Text>
          <Text style={styles.processSubtitle}>
            {isCompleted ? 'İşlem tamamlandı!' : 'İşlem devam ediyor...'}
          </Text>
        </View>

        {/* Damla Animasyonları */}
        {(isPlaying || isCompleted) && (
          <View style={styles.dropsContainer}>
            {dropAnimations.map((drop, index) => (
              <Animated.Text
                key={index}
                style={[
                  styles.dropEmoji,
                  styles.processDropEmoji,
                  {
                    transform: [
                      { 
                        translateX: Animated.add(
                          drop.x, 
                          drop.horizontalSway || new Animated.Value(0)
                        )
                      },
                      { 
                        translateY: Animated.add(
                          drop.y, 
                          drop.verticalSway || new Animated.Value(0)
                        )
                      },
                      { scale: drop.scale || new Animated.Value(1) },
                    ],
                    opacity: drop.opacity,
                  }
                ]}
              >
                💧
              </Animated.Text>
            ))}
          </View>
        )}

        {/* Konfeti Animasyonları - Gerçek Konfeti */}
        {showConfetti && (
          <View style={styles.confettiContainer}>
            {confettiAnimations.map((confetti, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.confettiPiece,
                  {
                    backgroundColor: confetti.color < 0.2 ? '#FFD700' : 
                                   confetti.color < 0.4 ? '#FF6B6B' :
                                   confetti.color < 0.6 ? '#4ECDC4' :
                                   confetti.color < 0.8 ? '#45B7D1' : '#96CEB4',
                    transform: [
                      { translateX: confetti.x },
                      { translateY: confetti.y },
                      { 
                        rotate: confetti.rotation.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '720deg'],
                        })
                      }
                    ],
                    opacity: confetti.opacity,
                  }
                ]}
              />
            ))}
          </View>
        )}

        {/* Progress Göstergesi */}
        <View style={styles.techProgressContainer}>
          <View style={styles.progressCircle}>
            <View style={styles.progressRing}>
              <Animated.View
                style={[
                  styles.progressFillCircle,
                  {
                    transform: [{
                      rotate: animatedValue.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      })
                    }]
                  }
                ]}
              />
            </View>
            <View style={styles.progressContent}>
              {isCompleted ? (
                <>
                  <Ionicons name="checkmark" size={60} color="white" />
                  <Text style={styles.completedLabel}>TAMAMLANDI</Text>
                </>
              ) : (
                <>
                  <Text style={styles.progressPercentage}>{Math.round(progress * 100)}%</Text>
                  <Text style={styles.progressLabel}>TAMAMLANDI</Text>
                </>
              )}
            </View>
          </View>

          <View style={styles.techProgressBar}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.techProgressText}>
              {isCompleted ? '✅ SÜREÇ TAMAMLANDI' : progress >= 1 ? '✅ İŞLEM TAMAMLANDI' : isPlaying ? 'İŞLEM SÜRÜYOR...' : 'HAZIR'}
            </Text>
          </View>
        </View>

        {/* Bilgi */}
        <View style={styles.processInfo}>
          <Text style={styles.processInfoText}>
            {isCompleted ? '🎉 İşlem başarıyla tamamlandı!' : isPlaying ? '🔊 Yüksek frekanslı ses çıkıyor' : '⏳ İşlem başlatılmayı bekliyor'}
          </Text>
          <Text style={styles.processInfoText}>
            {isCompleted ? '🏠 Ana sayfaya yönlendiriliyorsunuz...' : '💧 Su damlacıkları hoparlörden atılıyor'}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );

  // Mikrofon test sayfası
  const renderMicTestScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#42adf5', '#2980b9']}
        style={styles.gradient}
      >
        <View style={styles.micTestContainer}>
          {/* Başlık - Emoji olmadan */}
          <View style={styles.micTestHeader}>
            <Text style={styles.testPageTitle}>MİKROFON TESTİ</Text>
            <Text style={styles.testPageSubtitle}>
              {testPhase === 'ready' ? 'Profesyonel Mikrofon Analiz Sistemi' : 
               testPhase === 'testing' ? 'Test Sürüyor...' : 'Test Tamamlandı'}
            </Text>
          </View>

          {/* Ana Test Alanı */}
          <View style={styles.micTestMainArea}>
            
            {/* Teknolojik Test Display */}
            <View style={styles.techTestDisplay}>
              
              {/* Ses Seviyesi Göstergesi */}
              <View style={styles.audioAnalyzer}>
                <Text style={styles.analyzerTitle}>AUDIO LEVEL ANALYZER</Text>
                <View style={styles.audioSpectrumContainer}>
                  {[...Array(12)].map((_, index) => {
                    // Her çubuk için farklı animasyon seviyesi
                    const barLevel = isTesting 
                      ? Math.max(5, simulatedAudioLevel * (0.3 + Math.random() * 0.7) * (0.5 + Math.sin(testDuration + index) * 0.5))
                      : Math.max(5, simulatedAudioLevel * (0.3 + Math.random() * 0.7));
                    
                    return (
                      <View key={index} style={styles.spectrumBar}>
                        <Animated.View 
                          style={[
                            styles.spectrumFill,
                            {
                              height: `${barLevel}%`,
                              backgroundColor: barLevel > 70 ? '#ff6b6b' : 
                                             barLevel > 30 ? '#ffd93d' : '#6bcf7f'
                            }
                          ]}
                        />
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.audioLevelValue}>
                  {Math.round(simulatedAudioLevel)} dB
                </Text>
              </View>

              {/* Kalite Göstergesi */}
              <View style={styles.qualityMeter}>
                <Text style={styles.qualityTitle}>QUALITY SCORE</Text>
                <View style={styles.qualityCircle}>
                  <Animated.View 
                    style={[
                      styles.qualityProgress,
                      {
                        transform: [{
                          rotate: qualityAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0deg', '360deg'],
                          })
                        }]
                      }
                    ]}
                  />
                  <View style={styles.qualityContent}>
                    <Text style={styles.qualityScore}>{micQuality}%</Text>
                    <Text style={styles.qualityLabel}>
                      {micQuality >= 90 ? 'EXCELLENT' :
                       micQuality >= 80 ? 'GOOD' :
                       micQuality >= 60 ? 'FAIR' : 'POOR'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.qualityDescription}>
                  • Mikrofon performansı ve ses kalitesi analizi
                </Text>
              </View>
            </View>

          </View>

          {/* Ana Test Butonu - Aşağıda boş alanda */}
          <View style={styles.testButtonContainer}>
            <TouchableOpacity
              style={[
                styles.techTestButton,
                isTesting && styles.techTestButtonActive,
                testPhase === 'completed' && styles.techTestButtonCompleted
              ]}
              onPress={() => {
                console.log('🎤 Buton basıldı! Test Phase:', testPhase);
                if (testPhase === 'ready') {
                  console.log('🎤 Test başlatılıyor...');
                  startMicrophoneTest();
                } else if (testPhase === 'completed') {
                  console.log('🎤 Test sıfırlanıyor...');
                  resetTest();
                }
              }}
              disabled={isTesting}
              activeOpacity={0.8}
            >
              <View style={styles.techTestButtonContent}>
                {testPhase === 'ready' && (
                  <>
                    <Text style={styles.techTestButtonIcon}>▶</Text>
                    <Text style={styles.techTestButtonText}>BAŞLAT</Text>
                  </>
                )}
                {testPhase === 'testing' && (
                  <>
                    <Text style={styles.techTestButtonIcon}>⏸</Text>
                    <Text style={styles.techTestButtonText}>TEST SÜRÜYOR</Text>
                  </>
                )}
                {testPhase === 'completed' && (
                  <>
                    <Text style={styles.techTestButtonIcon}>↻</Text>
                    <Text style={styles.techTestButtonText}>YENİDEN TEST</Text>
                  </>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alt Navigasyon */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'main' && styles.activeNavItem]}
            onPress={() => {
              if (isTesting) {
                resetTest();
              }
              setCurrentScreen('main');
            }}
          >
            <Text style={[styles.navIcon, currentScreen === 'main' && styles.activeNavIcon]}>🏠</Text>
            <Text style={[styles.navText, currentScreen === 'main' && styles.activeNavText]}>Ana Sayfa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'mic-test' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('mic-test')}
          >
            <Text style={[styles.navIcon, currentScreen === 'mic-test' && styles.activeNavIcon]}>🎤</Text>
            <Text style={[styles.navText, currentScreen === 'mic-test' && styles.activeNavText]}>Mikrofon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'speaker-test' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('speaker-test')}
          >
            <Text style={[styles.navIcon, currentScreen === 'speaker-test' && styles.activeNavIcon]}>🔊</Text>
            <Text style={[styles.navText, currentScreen === 'speaker-test' && styles.activeNavText]}>Hoparlör</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // Hoparlör test sayfası
  const renderSpeakerTestScreen = () => (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#42adf5', '#2980b9']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.stereoTestHeader}>
          <Text style={styles.stereoTestTitle}>Stereo Test</Text>
        </View>

        {/* Hoparlörler Container */}
        <View style={styles.speakersContainer}>
          {/* Sol Hoparlör */}
          <View style={styles.speakerSection}>
            <Text style={[styles.speakerStatus, leftSpeakerActive && styles.speakerStatusActive]}>
              {leftSpeakerActive ? 'On' : 'Off'}
            </Text>
            
            <TouchableOpacity 
              style={styles.speakerButton}
              onPress={() => toggleSpeaker('left')}
              activeOpacity={0.8}
            >
              <View style={styles.speakerContainer}>
                {/* Animasyonlu Halkalar - Sadece aktif ve test ediliyorsa göster */}
                {speakerRingAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.speakerRing,
                      {
                        opacity: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.6],
                        }),
                        transform: [{
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.8],
                          }),
                        }],
                      },
                      // Animasyon sadece şu koşullarda görünür:
                      // 1. Test yapılıyor VE
                      // 2. Sol hoparlör aktif VE  
                      // 3. (Sol taraf test ediliyor VEYA her iki taraf test ediliyor)
                      isStereoTesting && leftSpeakerActive && (currentTestSide === 'left' || currentTestSide === 'both') ? {} : { opacity: 0 }
                    ]}
                  />
                ))}
                
                {/* Ana Hoparlör */}
                <Animated.View 
                  style={[
                    styles.speakerMain,
                    leftSpeakerActive && styles.speakerActive,
                    {
                      transform: [{
                        scale: leftSpeakerAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      }],
                    },
                  ]}
                >
                  <View style={styles.speakerInner}>
                    <View style={styles.speakerCenter} />
                  </View>
                  <View style={styles.speakerGrille}>
                    <View style={styles.grilleTop} />
                    <View style={styles.grilleBottom} />
                    <View style={styles.grilleLeft} />
                    <View style={styles.grilleRight} />
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.speakerLabel}>Left Channel</Text>
          </View>

          {/* Sağ Hoparlör */}
          <View style={styles.speakerSection}>
            <Text style={[styles.speakerStatus, rightSpeakerActive && styles.speakerStatusActive]}>
              {rightSpeakerActive ? 'On' : 'Off'}
            </Text>
            
            <TouchableOpacity 
              style={styles.speakerButton}
              onPress={() => toggleSpeaker('right')}
              activeOpacity={0.8}
            >
              <View style={styles.speakerContainer}>
                {/* Animasyonlu Halkalar - Sadece aktif ve test ediliyorsa göster */}
                {speakerRingAnimations.map((anim, index) => (
                  <Animated.View
                    key={index}
                    style={[
                      styles.speakerRing,
                      {
                        opacity: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.6],
                        }),
                        transform: [{
                          scale: anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.8],
                          }),
                        }],
                      },
                      // Animasyon sadece şu koşullarda görünür:
                      // 1. Test yapılıyor VE
                      // 2. Sağ hoparlör aktif VE  
                      // 3. (Sağ taraf test ediliyor VEYA her iki taraf test ediliyor)
                      isStereoTesting && rightSpeakerActive && (currentTestSide === 'right' || currentTestSide === 'both') ? {} : { opacity: 0 }
                    ]}
                  />
                ))}
                
                {/* Ana Hoparlör */}
                <Animated.View 
                  style={[
                    styles.speakerMain,
                    rightSpeakerActive && styles.speakerActive,
                    {
                      transform: [{
                        scale: rightSpeakerAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.1],
                        }),
                      }],
                    },
                  ]}
                >
                  <View style={styles.speakerInner}>
                    <View style={styles.speakerCenter} />
                  </View>
                  <View style={styles.speakerGrille}>
                    <View style={styles.grilleTop} />
                    <View style={styles.grilleBottom} />
                    <View style={styles.grilleLeft} />
                    <View style={styles.grilleRight} />
                  </View>
                </Animated.View>
              </View>
            </TouchableOpacity>
            
            <Text style={styles.speakerLabel}>Right Channel</Text>
          </View>
        </View>

        {/* Auto Tune Section */}
        <View style={styles.autoTuneSection}>
          <Text style={styles.autoTuneTitle}>Auto Tune</Text>
          <Text style={styles.autoTuneDescription}>
            Cycle of alternating playback: both, left, right
          </Text>
          <TouchableOpacity 
            style={[styles.autoTuneSwitch, autoTuneEnabled && styles.autoTuneSwitchActive]}
            onPress={() => setAutoTuneEnabled(!autoTuneEnabled)}
            activeOpacity={0.8}
          >
            <View style={[styles.autoTuneSwitchKnob, autoTuneEnabled && styles.autoTuneSwitchKnobActive]} />
          </TouchableOpacity>
        </View>

        {/* Start Button */}
        <TouchableOpacity 
          style={[styles.startTestButton, isStereoTesting && styles.startTestButtonActive]}
          onPress={startStereoTest}
          activeOpacity={0.9}
        >
          <Text style={styles.startTestButtonText}>
            {isStereoTesting ? 'Stop' : 'Start'}
          </Text>
        </TouchableOpacity>

        {/* Alt Navigasyon */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'main' && styles.activeNavItem]}
            onPress={() => {
              setCurrentScreen('main');
              // Stereo test durdur
              if (isStereoTesting) {
                stopStereoTest();
              }
            }}
          >
            <Text style={[styles.navIcon, currentScreen === 'main' && styles.activeNavIcon]}>🏠</Text>
            <Text style={[styles.navText, currentScreen === 'main' && styles.activeNavText]}>Ana Sayfa</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'mic-test' && styles.activeNavItem]}
            onPress={() => {
              setCurrentScreen('mic-test');
              // Stereo test durdur
              if (isStereoTesting) {
                stopStereoTest();
              }
            }}
          >
            <Text style={[styles.navIcon, currentScreen === 'mic-test' && styles.activeNavIcon]}>🎤</Text>
            <Text style={[styles.navText, currentScreen === 'mic-test' && styles.activeNavText]}>Mikrofon</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'speaker-test' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('speaker-test')}
          >
            <Text style={[styles.navIcon, currentScreen === 'speaker-test' && styles.activeNavIcon]}>🔊</Text>
            <Text style={[styles.navText, currentScreen === 'speaker-test' && styles.activeNavText]}>Hoparlör</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  // Ana render fonksiyonu
  return (
    <>
      {currentScreen === 'main' && renderMainScreen()}
      {currentScreen === 'water-process' && renderWaterProcessScreen()}
      {currentScreen === 'mic-test' && renderMicTestScreen()}
      {currentScreen === 'speaker-test' && renderSpeakerTestScreen()}
      {renderWarningModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 0,
  },

  // Ana sayfa stilleri
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 15,
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 8,
  },

  // Ana buton container
  mainButtonContainer: {
    alignItems: 'center',
    paddingVertical: 25,
    position: 'relative',
    justifyContent: 'center',
  },
  wavesContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 220,
    height: 220,
  },
  mainWave: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  mainWaterButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  mainWaterButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropEmoji: {
    fontSize: 80,
    color: '#42adf5',
  },
  processDropEmoji: {
    fontSize: 20,  // Biraz daha büyük yapıyorum ki görünsün
    position: 'absolute', // Mutlaka position absolute olmalı
    zIndex: 1000, // En üstte görünsün
  },

  // Teknolojik bilgi kartları
  infoCards: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flex: 1,
    paddingBottom: 10,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  infoCardTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoCardText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  infoCardTech: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontStyle: 'italic',
  },

  // Profesyonel navigasyon
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  activeNavItem: {
    // Aktif item için özel stil yok - sadece text rengi değişecek
  },
  navText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  navIcon: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 20,
    fontWeight: '400',
  },
  activeNavIcon: {
    color: 'white',
  },
  activeNavText: {
    color: 'white',
    fontWeight: '600',
  },

  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalGradient: {
    padding: 0,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    textAlign: 'center',
  },
  modalContent: {
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 12,
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  warningText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  continueButton: {
    backgroundColor: 'white',
    marginHorizontal: 30,
    marginBottom: 30,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  continueButtonText: {
    color: '#42adf5',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Su çıkarma süreç sayfası
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '600',
  },
  processHeader: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  processTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  processSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Animasyonlar
  dropsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 2,
  },

  // Progress göstergesi
  techProgressContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  progressCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  progressFillCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 4,
    borderColor: 'white',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressPercentage: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  completedLabel: {
    fontSize: 16,
    color: 'white',
    marginTop: 12,
    fontWeight: 'bold',
  },
  techProgressBar: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  techProgressText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 15,
    letterSpacing: 0.5,
  },
  processInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  processInfoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 6,
  },

  // Test sayfaları
  testPageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  testPageIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  testPageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 20,
    textAlign: 'center',
  },
  testPageSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 12,
    textAlign: 'center',
  },

  // Hoparlör test
  speakerTestHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  speakerTestButtons: {
    width: '100%',
    alignItems: 'center',
  },
  speakerTestButton: {
    width: 200,
    height: 80,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  mainSpeakerButton: {
    width: 220,
    height: 90,
  },
  speakerTestButtonContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  speakerButtonIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  speakerTestButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  speakerTestButtonSubText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    marginTop: 2,
  },

  // Mikrofon test sayfası
  micTestContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20, // Alt navigasyon için yer bırak
  },
  micTestHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  micTestMainArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-start',
  },
  
  // Teknolojik test display
  techTestDisplay: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  
  audioAnalyzer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  analyzerTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    letterSpacing: 1,
  },
  audioSpectrumContainer: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  spectrumBar: {
    flex: 1,
    height: '100%',
    marginHorizontal: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    justifyContent: 'flex-end',
  },
  spectrumFill: {
    width: '100%',
    backgroundColor: '#6bcf7f',
    borderRadius: 2,
    minHeight: 5,
  },
  audioLevelValue: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  
  qualityMeter: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 30,
  },
  qualityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    letterSpacing: 1,
  },
  qualityCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
    position: 'relative',
  },
  qualityProgress: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 5,
    borderColor: '#6bcf7f',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  qualityContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityScore: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  qualityLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 1,
  },
  qualityDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    marginTop: 15,
    marginBottom: 100, // Buton ile metin arasında boşluk bırak
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  
  testButtonContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    paddingBottom: 20,
    justifyContent: 'center', // Yatayda ortalama için
  },

  // Teknolojik info paneli - ana sayfa için
  techInfoPanel: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  
  techTestButton: {
    width: '80%',
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  techTestButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  techTestButtonCompleted: {
    backgroundColor: '#6bcf7f',
  },
  techTestButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%', // Tam genişlik kullan
  },
  techTestButtonIcon: {
    fontSize: 18,
    marginRight: 8,
    fontWeight: 'bold',
    color: '#42adf5',
    textAlign: 'center', // İkonu ortala
  },
  techTestButtonText: {
    color: '#42adf5',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center', // Metni ortala
  },
  techInfoPanelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
    letterSpacing: 1,
  },
  techInfoList: {
    paddingLeft: 20,
  },
  techInfoListItem: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginBottom: 6,
  },

  // Stereo Test
  stereoTestHeader: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  stereoTestTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  
  speakersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginBottom: 60,
    flex: 1,
    maxHeight: 300,
  },
  speakerSection: {
    alignItems: 'center',
  },
  speakerStatus: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  speakerStatusActive: {
    color: 'white',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
  speakerButton: {
    padding: 0,
  },
  speakerContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  speakerRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: 'white',
  },
  speakerMain: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  speakerInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(66, 173, 245, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(66, 173, 245, 0.5)',
  },
  speakerCenter: {
    width: 20,
    height: 20,
    backgroundColor: '#42adf5',
    borderRadius: 10,
  },
  speakerGrille: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
    flexDirection: 'column',
    paddingVertical: 20,
  },
  grilleTop: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(66, 173, 245, 0.6)',
    borderRadius: 1,
  },
  grilleBottom: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(66, 173, 245, 0.6)',
    borderRadius: 1,
  },
  grilleLeft: {
    position: 'absolute',
    left: 15,
    top: '50%',
    width: 2,
    height: 30,
    backgroundColor: 'rgba(66, 173, 245, 0.6)',
    borderRadius: 1,
    marginTop: -15,
  },
  grilleRight: {
    position: 'absolute',
    right: 15,
    top: '50%',
    width: 2,
    height: 30,
    backgroundColor: 'rgba(66, 173, 245, 0.6)',
    borderRadius: 1,
    marginTop: -15,
  },
  speakerLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
    textAlign: 'center',
  },
  speakerActive: {
    backgroundColor: 'white',
    borderColor: '#42adf5',
    borderWidth: 3,
  },

  // Auto Tune
  autoTuneSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingHorizontal: 40,
  },
  autoTuneTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  autoTuneDescription: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  autoTuneSwitch: {
    width: 60,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    padding: 2,
  },
  autoTuneSwitchActive: {
    backgroundColor: 'white',
  },
  autoTuneSwitchKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  autoTuneSwitchKnobActive: {
    backgroundColor: 'white',
    transform: [{ translateX: 30 }],
  },

  // Start Test Button
  startTestButton: {
    backgroundColor: 'white',
    paddingHorizontal: 60,
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 60,
    marginHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startTestButtonActive: {
    backgroundColor: '#E74C3C',
  },
  startTestButtonText: {
    color: '#42adf5',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
  },

  // Tone
  tone: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  toneTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  toneDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  toneInput: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    marginBottom: 20,
    color: 'white',
  },
  toneSlider: {
    width: '100%',
    height: 4,
    marginBottom: 20,
  },
  toneSliderValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  toneButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '80%',
    alignSelf: 'center',
  },
  toneButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // dB Meter
  dbMeter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  dbMeterTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  dbMeterDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
  },
  dbMeterInput: {
    width: '100%',
    height: 50,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 20,
    marginBottom: 20,
    color: 'white',
  },
  dbMeterSlider: {
    width: '100%',
    height: 4,
    marginBottom: 20,
  },
  dbMeterSliderValue: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dbMeterButton: {
    backgroundColor: 'white',
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    width: '80%',
    alignSelf: 'center',
  },
  dbMeterButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
});


