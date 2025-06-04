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

  useEffect(() => {
    setupAudio();
    startMainWaveAnimations();
    loadSound();
    return () => {
      if (progressTimer.current) {
        clearInterval(progressTimer.current);
      }
      toneGenerator.stop();
      unloadSound();
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
      // Basit sabit pozisyonlar
      const fixedY = 300 + (index % 5) * 50; // 5 farklı Y seviyesi
      const delayTime = index * 50; // Çok hızlı başlangıç
      
      console.log(`Damla ${index}: Y=${fixedY}, Delay=${delayTime}ms`);
      
      // Başlangıç pozisyonu
      drop.x.setValue(-30);
      drop.y.setValue(fixedY);
      drop.opacity.setValue(0);
      
      // Basit animasyon
      setTimeout(() => {
        console.log(`💧 Damla ${index} görünmeye başladı`);
        
        // Görünür yap
        Animated.timing(drop.opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          console.log(`💧 Damla ${index} görünür oldu, harekete başlıyor`);
          
          // Hareket ettir
          Animated.timing(drop.x, {
            toValue: width + 30,
            duration: 3000,
            useNativeDriver: true,
          }).start(() => {
            console.log(`💧 Damla ${index} hareket tamamlandı`);
            
            // Tekrar et (sadece isPlaying true ise)
            if (isPlaying) {
              setTimeout(() => {
                console.log(`💧 Damla ${index} yeniden başlıyor`);
                drop.x.setValue(-30);
                drop.y.setValue(300 + (index % 5) * 50);
                
                Animated.timing(drop.opacity, {
                  toValue: 1,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  Animated.timing(drop.x, {
                    toValue: width + 30,
                    duration: 3000,
                    useNativeDriver: true,
                  }).start();
                });
              }, 500);
            }
          });
        });
      }, delayTime);
    });

    // 51 saniye sonra durdur
    setTimeout(() => {
      console.log('💧 51 saniye doldu, damlalar kayboluyor...');
      dropAnimations.forEach((drop, index) => {
        setTimeout(() => {
          Animated.timing(drop.opacity, {
            toValue: 0,
            duration: 1000,
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
                      { translateX: drop.x },
                      { translateY: drop.y },
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
        <View style={styles.testPageContainer}>
          <Text style={[styles.testPageIcon]}>🎤</Text>
          <Text style={styles.testPageTitle}>Mikrofon Test</Text>
          <Text style={styles.testPageSubtitle}>Ses kaydı ve analiz özelliği yakında...</Text>
        </View>

        {/* Alt Navigasyon */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'main' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('main')}
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
        <View style={styles.testPageContainer}>
          <View style={styles.speakerTestHeader}>
            <Text style={[styles.testPageIcon]}>🔊</Text>
            <Text style={styles.testPageTitle}>Hoparlör Test</Text>
            <Text style={styles.testPageSubtitle}>Farklı hoparlörleri test edin</Text>
          </View>

          <View style={styles.speakerTestButtons}>
            <TouchableOpacity style={styles.speakerTestButton} activeOpacity={0.8}>
              <View style={styles.speakerTestButtonContent}>
                <Text style={styles.speakerButtonIcon}>🔉</Text>
                <Text style={styles.speakerTestButtonText}>SOL HOPARLÖR</Text>
                <Text style={styles.speakerTestButtonSubText}>Test Et</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.speakerTestButton} activeOpacity={0.8}>
              <View style={styles.speakerTestButtonContent}>
                <Text style={styles.speakerButtonIcon}>🔊</Text>
                <Text style={styles.speakerTestButtonText}>SAĞ HOPARLÖR</Text>
                <Text style={styles.speakerTestButtonSubText}>Test Et</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.speakerTestButton, styles.mainSpeakerButton]} activeOpacity={0.8}>
              <View style={styles.speakerTestButtonContent}>
                <Text style={styles.speakerButtonIcon}>🔊</Text>
                <Text style={[styles.speakerTestButtonText, { fontSize: 16 }]}>ANA HOPARLÖR</Text>
                <Text style={styles.speakerTestButtonSubText}>Yüksek Kalite</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Alt Navigasyon */}
        <View style={styles.bottomNavigation}>
          <TouchableOpacity
            style={[styles.navItem, currentScreen === 'main' && styles.activeNavItem]}
            onPress={() => setCurrentScreen('main')}
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
});


