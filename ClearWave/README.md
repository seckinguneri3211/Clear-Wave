# Clear Wave - Water Ejection App

Clear Wave, iPhone'unuza su girdiğinde özel frekans sesler üreterek suyu dışarı atmak için tasarlanmış bir iOS uygulamasıdır. Apple Watch'un su atma özelliğine benzer şekilde çalışır.

## Özellikler

- **Basit Tek Sayfa Tasarım**: Kullanımı kolay, minimal arayüz
- **Yerel Ses Üretimi**: API gerektirmez, cihazda ses üretimi
- **Büyük Merkezi Buton**: Kolay erişim için 200x200 piksel buton
- **Ses Dalgası Animasyonları**: Görsel geri bildirim
- **Farklı Frekans Seçenekleri**: 165Hz - 2000Hz arası ayarlanabilir
- **Süre ve Yoğunluk Kontrolü**: Özelleştirilebilir ayarlar

## Teknik Özellikler

- **Minimum iOS Sürümü**: iOS 15.0+
- **Framework'ler**: SwiftUI, AVFoundation
- **Ses Teknolojisi**: AVAudioEngine ile sinüs dalgası üretimi
- **Frekanslar**: 
  - Base frekans: 165Hz (Apple Watch benzeri)
  - Yüksek frekans: 2000Hz (daha etkili temizlik için)
- **Döngü Sistemi**: 30 saniye açık, 5 saniye kapalı

## Kullanım

1. Uygulamayı açın
2. Telefon hoparlörünü aşağı doğru çevirin
3. Ses seviyesini maksimuma ayarlayın
4. Merkezi butona basın
5. Uygulama otomatik olarak ses döngülerini başlatır
6. İstediğiniz zaman durdurabilirsiniz

## Kurulum

1. Xcode'da projeyi açın
2. Simulator veya gerçek cihazda çalıştırın
3. Gerekli ses izinlerini verin

## Dosya Yapısı

- `ContentView.swift` - Ana sayfa arayüzü
- `SoundManager.swift` - Ses yönetimi ve üretimi
- `WaveAnimationView.swift` - Dalga animasyonları
- `ClearWaveApp.swift` - Ana uygulama dosyası
- `Info.plist` - Uygulama izinleri ve ayarları

## Güvenlik

- Ses seviyesi kulak dostu seviyelerde tutulur
- Otomatik durdurma özelliği
- Kullanıcı kontrolü her zaman aktif

## Notlar

- Bu uygulama Apple Watch'un su atma özelliğinden esinlenmiştir
- Ses dalgaları suyu etkili bir şekilde atmak için optimize edilmiştir
- Sürekli kullanım önerilmez, sadece gerektiğinde kullanın

## Lisans

Bu proje eğitim amaçlı oluşturulmuştur. 