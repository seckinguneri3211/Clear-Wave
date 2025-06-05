import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Ana animasyon sekansı
    Animated.sequence([
      // İlk olarak logo fade in ve scale
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 7,
          useNativeDriver: true,
        })
      ]),
      // Sonra metin fade in
      Animated.timing(textFadeAnim, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      })
    ]).start();
    
    // Bekleme süresi sonunda onFinish callback'i çağır
    // Geçişi uygulamadaki diğer bileşenlerle kontrol edeceğiz
    setTimeout(() => {
      onFinish();
    }, 3000);
  }, []);

  return (
    <LinearGradient
      colors={['#001733', '#001F47', '#001733']}
      style={styles.container}
    >
      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image 
          source={require('../assets/icon-y.png')} 
          style={styles.logoImage} 
          resizeMode="contain"
        />
      </Animated.View>

      {/* Slogan */}
      <Animated.View
        style={[
          styles.sloganContainer,
          {
            opacity: textFadeAnim
          }
        ]}
      >
        <Text style={styles.title}>Clear Wave</Text>
        <Text style={styles.slogan}>Cihazınızdaki Su Sorunlarını Çözün</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001F47',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 220,
    height: 220,
  },
  sloganContainer: {
    marginTop: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  slogan: {
    fontSize: 18,
    color: '#CCDDFF',
    textAlign: 'center',
  }
});

export default SplashScreen; 