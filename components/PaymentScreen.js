import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Dimensions, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { adapty } from 'react-native-adapty';

const { width } = Dimensions.get('window');

// Sabit ürün ID'leri - App Store Connect'te tanımlanan ID'ler
const WEEKLY_PRODUCT_ID = '01_rc_499_1w_3d0';
const YEARLY_PRODUCT_ID = '01_rc_2499_1y';

// Placement ID - Adapty Dashboard'da tanımlanan
const PLACEMENT_ID = '01_default';

const PaymentScreen = ({ onContinue, onCancel }) => {
  const [freeTrial, setFreeTrial] = useState(true);
  const [closeVisible, setCloseVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const opacityAnimation = useRef(new Animated.Value(0)).current;
  const buttonAnimation = useRef(new Animated.Value(0)).current;
  const closeOpacity = useRef(new Animated.Value(0)).current;
  const [isWeekly, setIsWeekly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [paywallProducts, setPaywallProducts] = useState([]);
  const [paywallError, setPaywallError] = useState(null);

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
    
    // Paywall verilerini yükle
    loadPaywallProducts();
    
    return () => clearTimeout(timer);
  }, []);

  const loadPaywallProducts = async () => {
    try {
      console.log('Paywall verileri yükleniyor...');
      
      // Adapty profilini kontrol et
      const profile = await adapty.getProfile();
      console.log('Adapty Profil:', {
        profileId: profile.profileId,
        accessLevels: Object.keys(profile.accessLevels || {}),
        subscriptions: Object.keys(profile.subscriptions || {})
      });

      // Paywall'u yükle
      const paywall = await adapty.getPaywall(PLACEMENT_ID);
      if (!paywall) {
        throw new Error('Paywall bulunamadı');
      }

      // Paywall ürünlerini yükle
      const products = await adapty.getPaywallProducts(paywall);
      console.log('Paywall ürünleri:', products?.map(p => ({
        vendorId: p.vendorProductId,
        price: p.price,
        localizedPrice: p.localizedPrice
      })));

      if (!products?.length) {
        throw new Error('Paywall ürünleri bulunamadı');
      }

      // Ürünleri filtrele
      const validProducts = products.filter(p => 
        p.vendorProductId === WEEKLY_PRODUCT_ID || 
        p.vendorProductId === YEARLY_PRODUCT_ID
      );

      if (!validProducts.length) {
        throw new Error('Geçerli ürün bulunamadı');
      }

      setPaywallProducts(validProducts);
      setPaywallError(null);
      
    } catch (error) {
      console.error('Paywall yükleme hatası:', {
        message: error.message,
        code: error.code
      });
      
      setPaywallError(error.message);
      Alert.alert(
        'Paywall Hatası',
        'Ürün bilgileri yüklenemedi. Lütfen şunları kontrol edin:\n\n' +
        '1. App Store Connect\'te ürün ID\'leri doğru mu?\n' +
        `• Haftalık: ${WEEKLY_PRODUCT_ID}\n` +
        `• Yıllık: ${YEARLY_PRODUCT_ID}\n\n` +
        '2. Adapty Dashboard\'da:\n' +
        `• Placement ID: ${PLACEMENT_ID}\n` +
        '• Ürünler App Store Connect ile eşleşiyor mu?\n\n' +
        '3. Sandbox test kullanıcısı ile giriş yapıldı mı?',
        [{ text: 'Tamam' }]
      );
    }
  };

  const getProductId = () => {
    // Önce paywall ürünlerinden bul
    if (paywallProducts.length > 0) {
      const product = paywallProducts.find(p => 
        p.vendorProductId === (isWeekly ? WEEKLY_PRODUCT_ID : YEARLY_PRODUCT_ID)
      );
      if (product?.vendorProductId) {
        return product.vendorProductId;
      }
    }
    // Fallback olarak sabit ID'yi kullan
    return isWeekly ? WEEKLY_PRODUCT_ID : YEARLY_PRODUCT_ID;
  };

  const handlePurchase = async () => {
    try {
      setLoading(true);
      
      // Profil kontrolü
      const profile = await adapty.getProfile();
      console.log('Profil kontrolü:', {
        profileId: profile.profileId,
        connected: true
      });
      
      const productId = getProductId();
      console.log('Satın alma başlatıldı:', {
        productId,
        isWeekly,
        freeTrial,
        paywallProductsCount: paywallProducts.length
      });
      
      // Paywall ürünlerini kontrol et
      if (!paywallProducts.length) {
        await loadPaywallProducts();
      }
      
      // Ürün kontrolü
      if (!productId) {
        throw new Error('Ürün ID\'si bulunamadı');
      }

      // Doğru ürünü bul
      const selectedProduct = paywallProducts.find(p => p.vendorProductId === productId);
      if (!selectedProduct) {
        throw new Error('Seçilen ürün bulunamadı');
      }

      console.log('Seçilen ürün:', {
        id: selectedProduct.vendorProductId,
        price: selectedProduct.price?.localizedString
      });
      
      // Satın alma işlemi
      const result = await adapty.makePurchase(selectedProduct);
      
      console.log('Satın alma sonucu:', result);
      
      if (!result?.accessLevels?.premium?.isActive) {
        throw new Error('Premium aktivasyonu başarısız');
      }
      
      Alert.alert('Başarılı', 'Premium aktif edildi!');
      onContinue && onContinue();
      
    } catch (error) {
      console.log('Satın alma hatası:', {
        message: error.message,
        code: error.code,
        productId: getProductId()
      });
      
      let errorMessage = 'Satın alma işlemi başarısız oldu.';
      
      if (error.message.includes('encodingFailed')) {
        errorMessage = 'Ürün bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.';
      } else if (error.message.includes('badRequest')) {
        errorMessage = 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
      } else if (error.message.includes('Seçilen ürün bulunamadı')) {
        errorMessage = 'Seçilen paket bulunamadı. Lütfen farklı bir paket seçin.';
      }
      
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRestorePress = async () => {
    try {
      setLoading(true);
      console.log('🔄 Satın alımlar geri yükleniyor...');
      
      const result = await adapty.restorePurchases();
      
      console.log('✅ Geri yükleme sonucu:', {
        success: true,
        accessLevel: result.accessLevel,
        isActive: result.accessLevel?.isActive
      });
      
      if (result.accessLevel?.isActive) {
        Alert.alert('Başarılı', 'Satın alımlarınız geri yüklendi!');
        onContinue && onContinue();
      } else {
        Alert.alert('Bilgi', 'Geri yüklenecek satın alım bulunamadı.');
      }
    } catch (e) {
      console.error('❌ Geri yükleme hatası:', {
        message: e.message,
        code: e.code,
        stack: e.stack
      });
      Alert.alert('Geri yükleme başarısız', e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeTrial = () => {
    setFreeTrial(!freeTrial);
    setIsWeekly(true); // Free trial sadece haftalık pakette
  };

  const handleDebugInfo = () => {
    const debugInfo = 
      `=== ADAPTY DEBUG BİLGİLERİ ===\n` +
      `Bundle ID: com.clearwave.removewaterpro\n` +
      `Adapty Public Key: public_live_I8BdB1bU.lrOqMamz477qZkP2bsJ3\n` +
      `Placement ID: ${PLACEMENT_ID}\n` +
      `Subscription Group: Wave Clear Premium\n\n` +
      `=== PAYWALL DURUMU ===\n` +
      `Paywall Ürün Sayısı: ${paywallProducts.length}\n` +
      `Paywall Hatası: ${paywallError || 'Yok'}\n` +
      `Mevcut Ürün ID: ${getProductId()}\n` +
      `Haftalık Paket: ${isWeekly ? 'Evet' : 'Hayır'}\n` +
      `Free Trial: ${freeTrial ? 'Evet' : 'Hayır'}\n\n` +
      `=== ÜRÜN LİSTESİ ===\n` +
      (paywallProducts.length > 0 ? 
        paywallProducts.map(p => `• ${p.id} - ${p.localizedPrice} (${p.currencyCode})`).join('\n') :
        'Hiç ürün yüklenmedi!\n\n=== FALLBACK ÜRÜNLER ===\n' +
        `• ${WEEKLY_PRODUCT_ID} (Haftalık)\n` +
        `• ${YEARLY_PRODUCT_ID} (Yıllık)`
      ) +
      `\n\n=== ÇÖZÜM ÖNERİLERİ ===\n` +
      `1. App Store Connect'te ürün ID'lerini kontrol et\n` +
      `2. Adapty Dashboard'da ürün ID'lerini güncellemesi\n` +
      `3. Placement ID'nin eşleşmesi\n` +
      `4. Sandbox test kullanıcısı kontrolü`;
    
    Alert.alert('Debug Bilgisi', debugInfo, [
      { text: 'Kopyala', onPress: () => console.log('DEBUG INFO:\n', debugInfo) },
      { text: 'Tamam' }
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
        <Text style={styles.loadingText}>İşleniyor...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#001733', '#003166', '#001733']}
      style={styles.container}
    >
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
            <TouchableOpacity style={styles.ctaButton} onPress={handlePurchase}>
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
        <TouchableOpacity onPress={() => {}}>
          <Text style={styles.footerLink}>Terms of Use</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleRestorePress}>
          <Text style={styles.footerLink}>Restore</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDebugInfo}>
          <Text style={styles.footerLink}>Debug</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}}>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#001733',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
  },
});

export default PaymentScreen; 