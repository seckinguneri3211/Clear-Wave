import { Audio } from 'expo-av';

export class ToneGenerator {
  constructor() {
    this.sound = null;
    this.isPlaying = false;
  }

  async generateTone(frequency = 165, duration = 30000, volume = 0.6) {
    try {
      // React Native için basit bir beep sesi oluştur
      const { sound } = await Audio.Sound.createAsync(
        { 
          uri: `data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUeBDGH0fPTgjMGHZnX8tp7LQUjdcPF6eKRQAoUWazh666XVw==` 
        },
        { shouldPlay: false, isLooping: false }
      );
      
      this.sound = sound;
      
      // Volume ayarla
      await this.sound.setVolumeAsync(volume);
      
      // Ses çal
      await this.sound.playAsync();
      this.isPlaying = true;
      
      // Belirtilen süre sonra durdur
      if (duration > 0) {
        setTimeout(() => {
          this.stop();
        }, duration);
      }
      
      return true;
    } catch (error) {
      console.error('Tone generation error:', error);
      
      // Fallback: Sistem sesi çal
      try {
        await Audio.Sound.createAsync(
          require('expo/AppLoading'), // Sistem beep sesi
          { shouldPlay: true, isLooping: false }
        );
      } catch (fallbackError) {
        console.log('Fallback sound also failed:', fallbackError);
      }
      
      return false;
    }
  }

  stop() {
    try {
      if (this.sound && this.isPlaying) {
        this.sound.stopAsync();
        this.sound.unloadAsync();
        this.isPlaying = false;
        this.sound = null;
      }
    } catch (error) {
      console.error('Stop tone error:', error);
    }
  }

  // Frekans döngüsü (Apple Watch benzeri)
  async startFrequencyCycle(baseFreq = 165, highFreq = 2000, duration = 30000, volume = 0.6) {
    console.log('Starting frequency cycle with volume:', volume);
    
    const playTone = async (freq, dur) => {
      try {
        // Basit beep tonları çal
        const { sound } = await Audio.Sound.createAsync(
          freq > 1000 
            ? { uri: 'https://www.soundjay.com/misc/sounds/beep-10.wav' }
            : { uri: 'https://www.soundjay.com/misc/sounds/beep-07.wav' },
          { shouldPlay: true, isLooping: true, volume: volume }
        );
        
        this.sound = sound;
        this.isPlaying = true;
        
        // Döngü süresi boyunca çal
        setTimeout(() => {
          this.stop();
        }, dur);
        
        return true;
      } catch (error) {
        console.log('Frequency cycle error:', error);
        return false;
      }
    };
    
    // Ana döngü başlat
    const startTime = Date.now();
    const cycle = async () => {
      if (Date.now() - startTime < duration && this.isPlaying) {
        // Base frequency çal (15 saniye)
        await playTone(baseFreq, 15000);
        
        // Kısa duraklama
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // High frequency çal (15 saniye) 
        if (Date.now() - startTime < duration) {
          await playTone(highFreq, 15000);
        }
        
        // 5 saniye duraklama
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Devam et
        if (Date.now() - startTime < duration) {
          cycle();
        }
      }
    };
    
    this.isPlaying = true;
    cycle();
  }
}

export default ToneGenerator; 