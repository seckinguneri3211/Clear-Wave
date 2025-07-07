import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppIntroSlider from 'react-native-app-intro-slider';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    key: 'slide1',
    title: 'Remove Water Instantly',
    text: 'Clear Wave uses professional sound technology to eject water from your device speakers in seconds.',
    image: require('../assets/Onboarding/onboarding-1.png'),
    backgroundColor: ['#001733', '#003166'],
  },
  {
    key: 'slide2',
    title: 'Safe & Effective',
    text: 'Our method is safe for your device and proven to be effective by thousands of users.',
    image: require('../assets/Onboarding/onboarding-2.png'),
    backgroundColor: ['#003166', '#001733'],
  },
  {
    key: 'slide3',
    title: 'Get Started Now',
    text: 'Just press Start and follow the simple instructions to clean your speakers.',
    image: require('../assets/Onboarding/onboarding-3.png'),
    backgroundColor: ['#001733', '#003166'],
  },
];

const Onboarding = ({ onDone }) => {
  // Animasyon değerleri
  const iconAnim = useRef(new Animated.Value(0)).current;
  const titleAnim = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  
  // Geçerli slide indexi ve slider referansı
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);

  const resetAnimations = () => {
    iconAnim.setValue(0);
    titleAnim.setValue(0);
    textAnim.setValue(0);
  };

  const startAnimations = () => {
    Animated.sequence([
      Animated.timing(iconAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      }),
      Animated.timing(textAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true
      })
    ]).start();
  };

  // İlk animasyonu başlat
  useEffect(() => {
    startAnimations();
  }, []);

  const handleSlideChange = (index) => {
    setActiveIndex(index);
    resetAnimations();
    startAnimations();
  };

  // Sonraki slide'a geçiş işlevi
  const goToNextSlide = () => {
    // Önce bir sonraki slideın index değerini hesapla
    const nextIndex = activeIndex + 1;
    
    // Son slide'dayız, işlemi bitir
    if (nextIndex >= slides.length) {
      onDone();
      return;
    }
    
    // Slider referansı var ve doğru çalışıyorsa
    if (sliderRef.current) {
      // Sonraki slide'a geç
      sliderRef.current.goToSlide(nextIndex, true);
      // State'i güncelle
      setActiveIndex(nextIndex);
      // Animasyonları resetle ve yeniden başlat
      resetAnimations();
      startAnimations();
    }
  };

  const renderItem = ({ item }) => {
    return (
      <LinearGradient
        colors={item.backgroundColor}
        style={styles.slide}
      >
        <View style={styles.content}>
          <Animated.View 
            style={[
              styles.imageContainer, 
              {
                opacity: iconAnim,
                transform: [
                  { scale: iconAnim },
                  { translateY: Animated.multiply(
                      Animated.subtract(1, iconAnim),
                      20
                    ) 
                  }
                ]
              }
            ]}
          >
            <Image 
              source={item.image} 
              style={styles.image}
              resizeMode="contain"
            />
          </Animated.View>
          
          <Animated.Text 
            style={[
              styles.title,
              {
                opacity: titleAnim,
                transform: [
                  { 
                    translateY: Animated.multiply(
                      Animated.subtract(1, titleAnim),
                      20
                    )
                  }
                ]
              }
            ]}
          >
            {item.title}
          </Animated.Text>
          
          <Animated.Text 
            style={[
              styles.text,
              {
                opacity: textAnim,
                transform: [
                  { 
                    translateY: Animated.multiply(
                      Animated.subtract(1, textAnim),
                      20
                    )
                  }
                ]
              }
            ]}
          >
            {item.text}
          </Animated.Text>
        </View>
        
        {/* Indicator noktaları */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === activeIndex && styles.activeDot
              ]}
            />
          ))}
        </View>
        
        {/* Boşluk */}
        <View style={{ height: 20 }} />
        
        {/* Bottom button - Manual yöntem */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={goToNextSlide}
            activeOpacity={0.8}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <LinearGradient
              colors={['#0066CC', '#4CB5FF']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>
                {activeIndex === slides.length - 1 ? 'Start' : 'Continue'}
              </Text>
              <Ionicons 
                name={activeIndex === slides.length - 1 ? "checkmark" : "arrow-forward"} 
                size={20} 
                color="#FFFFFF" 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <AppIntroSlider
        ref={sliderRef}
        data={slides}
        renderItem={renderItem}
        onDone={onDone}
        onSlideChange={handleSlideChange}
        showSkipButton={false}
        showNextButton={false}
        showDoneButton={false}
        scrollEnabled={false}
        dotStyle={{display: 'none'}}
        activeDotStyle={{display: 'none'}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40, // Daha fazla alt padding
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    marginTop: 50,
  },
  imageContainer: {
    width: 300,
    height: 300,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 51, 102, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 16,
    color: '#CCDDFF',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  buttonContainer: {
    width: width * 0.8,
    alignSelf: 'center',
    marginBottom: 60, // Daha fazla boşluk
    paddingBottom: 20, // Ekstra padding
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minHeight: 60, // Minimum yükseklik
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20, // Daha fazla dikey padding
    paddingHorizontal: 40,
    minHeight: 60, // Minimum yükseklik
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 12,
    height: 12,
    borderRadius: 6,
    marginHorizontal: 4,
  },
});

export default Onboarding; 