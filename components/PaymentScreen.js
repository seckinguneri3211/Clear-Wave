import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Dimensions, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const PaymentScreen = ({ onContinue, onCancel }) => {
  const [freeTrial, setFreeTrial] = useState(true);
  const [closeVisible, setCloseVisible] = useState(false); // X butonunu başlangıçta gizle
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const closeOpacity = useRef(new Animated.Value(0)).current; // Başlangıçta şeffaf

  useEffect(() => {
    // Animasyonları başlat
    Animated.timing(slideAnimation, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
    
    Animated.timing(opacityAnimation, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();
    
    Animated.spring(buttonAnimation, {
      toValue: 1,
      friction: 7,
      tension: 40,
      useNativeDriver: true
    }).start();
    
    // 5 saniye sonra X butonunu göster
    const timer = setTimeout(() => {
      setCloseVisible(true);
      Animated.timing(closeOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleFreeTrial = () => {
    setFreeTrial(!freeTrial);
  };

  const handleTermsPress = () => {
    // Terms of Use ekranına git
  };

  const handleRestorePress = () => {
    // Restore işlemi
  };

  const handlePrivacyPress = () => {
    // Privacy Policy ekranına git
  };

  return (
    <LinearGradient
      colors={['#001733', '#003166', '#001733']}
      style={styles.container}
    >
      {/* Onboarding noktaları - kaldırıldı */}

      {/* X Butonu */}
      <Animated.View style={[styles.closeButtonContainer, { opacity: closeOpacity }]}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onCancel}
          disabled={!closeVisible}
        >
          <View style={styles.xContainer}>
            <Text style={styles.xText}>X</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          style={[
            styles.contentContainer, 
            {
              opacity: opacityAnimation,
              transform: [
                { 
                  translateY: Animated.multiply(
                    Animated.subtract(1, slideAnimation),
                    50
                  )
                }
              ]
            }
          ]}
        >
          <View style={styles.card}>
            <Text style={styles.title}>
              Unlock Instant{'\n'}Water Eject with{'\n'}
              <Text style={styles.highlightedTitle}>Clear Wave Pro</Text>
            </Text>

            <Text style={styles.testimonialText}>
              "It worked!!! <Text style={styles.testimonialRegular}>Speaker was working horribly after i dropped it in the bath and it fixed it completely"</Text>
            </Text>
            
            <View style={styles.starsContainer}>
              <Text style={styles.starEmoji}>⭐⭐⭐⭐⭐</Text>
              <Text style={styles.testimonialAuthor}>Charlie D</Text>
            </View>
          </View>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Free Trial Enabled</Text>
            <Switch
              value={freeTrial}
              onValueChange={toggleFreeTrial}
              trackColor={{ false: '#00214D', true: '#0066CC' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor="#00214D"
              style={styles.switch}
            />
          </View>

          <View style={styles.planContainer}>
            <Text style={styles.planTitle}>
              {freeTrial ? '3-Day Free Trial' : 'Premium Access'}
            </Text>
            <Text style={styles.planPrice}>
              then {freeTrial ? '$4.99\nper week' : '$24.99\nper year'}
            </Text>
          </View>

          <Animated.View 
            style={[
              styles.buttonContainer, 
              {
                transform: [{ scale: buttonAnimation }]
              }
            ]}
          >
            <TouchableOpacity style={styles.ctaButton} onPress={onContinue}>
              <LinearGradient
                colors={['#0066CC', '#0088FF']}
                style={styles.ctaGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>
                  {freeTrial ? 'Try for 0.00' : 'Continue'}
                </Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {freeTrial && (
            <View style={styles.noPaymentContainer}>
              <Ionicons name="time-outline" size={20} color="#4CB5FF" />
              <Text style={styles.noPaymentText}>NO PAYMENT NOW</Text>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footerLinks}>
        <TouchableOpacity onPress={handleTermsPress}>
          <Text style={styles.footerLink}>Terms of Use</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestorePress}>
          <Text style={styles.footerLink}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePrivacyPress}>
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 80,
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 45,
    right: 15,
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 51, 102, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  xContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#103465',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#777777',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  contentContainer: {
    width: width * 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(0, 30, 76, 0.5)',
    borderRadius: 20,
    padding: 25,
    marginBottom: 25,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 42,
  },
  highlightedTitle: {
    color: '#4CB5FF',
  },
  starsContainer: {
    alignItems: 'center',
    marginTop: 15,
  },
  starEmoji: {
    fontSize: 24,
    marginBottom: 10,
    letterSpacing: 5,
  },
  testimonialText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  testimonialRegular: {
    fontWeight: 'normal',
  },
  testimonialAuthor: {
    fontSize: 16,
    color: '#CCDDFF',
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(0, 51, 102, 0.3)',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  toggleLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  switch: {
    transform: [{ scaleX: 1.1 }, { scaleY: 1.1 }],
  },
  planContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'rgba(0, 51, 102, 0.3)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'right',
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 20,
  },
  ctaButton: {
    width: '100%',
    height: 60,
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ctaGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  noPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noPaymentText: {
    fontSize: 14,
    color: '#4CB5FF',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  footerLinks: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 26, 51, 0.8)',
  },
  footerLink: {
    fontSize: 14,
    color: '#CCDDFF',
    fontWeight: '500',
  },
});

export default PaymentScreen; 