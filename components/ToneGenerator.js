import { Audio } from 'expo-av';

export class ToneGenerator {
  constructor() {
    this.audioContext = null;
    this.oscillator = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  async generateTone(frequency = 165, duration = 30000, volume = 0.6) {
    try {
      // Audio context oluştur (Web Audio API için)
      if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        const AudioCtx = AudioContext || webkitAudioContext;
        this.audioContext = new AudioCtx();
        
        // Oscillator oluştur
        this.oscillator = this.audioContext.createOscillator();
        this.gainNode = this.audioContext.createGain();
        
        // Bağlantıları yap
        this.oscillator.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
        
        // Parametreleri ayarla
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        this.oscillator.type = 'sine'; // Kulak dostu sinüs dalgası
        this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        
        // Ses çalmaya başla
        this.oscillator.start(this.audioContext.currentTime);
        
        // Belirlenen süre sonra durdur
        if (duration > 0) {
          this.oscillator.stop(this.audioContext.currentTime + duration / 1000);
        }
        
        this.isPlaying = true;
        
        // Stop event listener
        this.oscillator.onended = () => {
          this.isPlaying = false;
        };
        
        return true;
      } else {
        // Fallback: Vibration API kullan (ses yerine)
        console.log('Web Audio API not supported, using vibration fallback');
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          const pattern = [];
          for (let i = 0; i < duration / 1000; i++) {
            pattern.push(200, 100); // 200ms vibrate, 100ms pause
          }
          navigator.vibrate(pattern);
        }
        return false;
      }
    } catch (error) {
      console.error('Tone generation error:', error);
      return false;
    }
  }

  stop() {
    try {
      if (this.oscillator && this.isPlaying) {
        this.oscillator.stop();
        this.isPlaying = false;
      }
      
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
    } catch (error) {
      console.error('Stop tone error:', error);
    }
  }

  // Frekans döngüsü (Apple Watch benzeri)
  async startFrequencyCycle(baseFreq = 165, highFreq = 2000, duration = 30000, volume = 0.6) {
    const cycleDuration = 35000; // 30s on, 5s off
    const onDuration = 30000;
    
    const cycle = async () => {
      if (this.isPlaying) {
        // Base frequency çal
        await this.generateTone(baseFreq, onDuration / 2, volume);
        
        // Kısa pause
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // High frequency çal
        if (this.isPlaying) {
          await this.generateTone(highFreq, onDuration / 2, volume);
        }
        
        // 5 saniye pause
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Toplam süre kontolü
        if (Date.now() - startTime < duration) {
          cycle(); // Cycle devam et
        }
      }
    };
    
    const startTime = Date.now();
    this.isPlaying = true;
    cycle();
  }
}

export default ToneGenerator; 