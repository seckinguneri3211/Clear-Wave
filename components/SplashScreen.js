import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  const textSlideAnim = useRef(new Animated.Value(50)).current;
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  
  // Dalga animasyonları
  const waveAnimations = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;
  
  useEffect(() => {
    // Dalga animasyonlarını başlat
    startWaveAnimations();
    
    // Ana animasyon sekansı
    Animated.sequence([
      // İlk olarak logo fade in ve scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        // Logo döndürme animasyonu
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]),
      // Sonra metin fade in ve slide up
      Animated.parallel([
        Animated.timing(textFadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(textSlideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        })
      ])
    ]).start();
    
    // Shimmer efekti
    setTimeout(() => {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }, 1500);
    
    // Exit animasyonu ve onFinish
    setTimeout(() => {
      // Direkt onFinish çağır, animasyonu App.js'te yapalım
      onFinish();
    }, 3000);
  }, []);
  
  const startWaveAnimations = () => {
    waveAnimations.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 400),
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
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#001733', '#002147', '#001F47', '#001733']}
        style={styles.gradient}
      >
        {/* Dalga Animasyonları */}
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
                      outputRange: [0.8, 2.5],
                    })
                  }],
                  opacity: anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0.6, 0],
                  })
                }
              ]}
            />
          ))}
        </View>

        {/* Logo Container */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                {
                  rotateY: logoRotateAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['45deg', '0deg'],
                  })
                }
              ]
            }
          ]}
        >
          {/* Logo Background Glow */}
          <Animated.View
            style={[
              styles.logoGlow,
              {
                opacity: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.3],
                }),
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0.8, 1],
                    })
                  }
                ]
              }
            ]}
          />
          
          {/* Yuvarlak Logo Container */}
          <Animated.View
            style={[
              styles.logoImageContainer,
              {
                transform: [
                  {
                    rotate: logoRotateAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }
                ]
              }
            ]}
          >
            <Image 
              source={require('../assets/icon-y.png')} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          </Animated.View>
          
          {/* Shimmer Overlay */}
          <Animated.View
            style={[
              styles.shimmerOverlay,
              {
                opacity: shimmerAnim.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [0, 0.8, 0],
                }),
                transform: [
                  {
                    translateX: shimmerAnim.interpolate({
                      inputRange: [-1, 1],
                      outputRange: [-width, width],
                    })
                  }
                ]
              }
            ]}
          />
        </Animated.View>

        {/* Text Container */}
        <Animated.View
          style={[
            styles.textContainer,
            {
              opacity: textFadeAnim,
              transform: [
                { translateY: textSlideAnim },
                {
                  scale: textFadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  })
                }
              ]
            }
          ]}
        >
          <Text style={styles.title}>Clear Wave</Text>
          <View style={styles.titleUnderline} />
          <Text style={styles.slogan}>Solve Water Issues in Your Device</Text>
          <Text style={styles.subtitle}>Professional Sound Technology</Text>
        </Animated.View>

        {/* Loading Indicator */}
        <Animated.View
          style={[
            styles.loadingContainer,
            {
              opacity: textFadeAnim,
              transform: [{ translateY: textSlideAnim }]
            }
          ]}
        >
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((index) => (
              <Animated.View
                key={index}
                style={[
                  styles.loadingDot,
                  {
                    opacity: shimmerAnim.interpolate({
                      inputRange: [-1, -0.5 + index * 0.2, 0, 0.5 + index * 0.2, 1],
                      outputRange: [0.3, 1, 0.3, 1, 0.3],
                    })
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>
              </LinearGradient>
      </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wavesContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: width,
    height: height,
    top: -100,
  },
  wave: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 2,
    borderColor: 'rgba(76, 181, 255, 0.3)',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4CB5FF',
    shadowColor: '#4CB5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
  },
  logoImageContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(76, 181, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(76, 181, 255, 0.3)',
    zIndex: 2,
  },
  logoImage: {
    width: 240,
    height: 240,
  },
  shimmerOverlay: {
    position: 'absolute',
    width: 60,
    height: 220,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
    borderRadius: 110,
    zIndex: 3,
  },
  textContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(76, 181, 255, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    width: 80,
    height: 3,
    backgroundColor: '#4CB5FF',
    marginBottom: 16,
    borderRadius: 2,
  },
  slogan: {
    fontSize: 18,
    color: '#CCDDFF',
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(204, 221, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: 80,
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CB5FF',
    marginHorizontal: 4,
  },
});

export default SplashScreen; 