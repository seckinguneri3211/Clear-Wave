import SwiftUI

struct ContentView: View {
    @StateObject private var soundManager = SoundManager()
    @State private var frequency: Double = 165
    @State private var duration: Double = 30
    @State private var intensity: Int = 1
    @State private var isEjecting: Bool = false
    
    private let minFrequency: Double = 165
    private let maxFrequency: Double = 2000
    
    var body: some View {
        GeometryReader { geometry in
            LinearGradient(
                gradient: Gradient(colors: [
                    Color(red: 0, green: 0.4, blue: 0.8),
                    Color(red: 0, green: 0.2, blue: 0.6)
                ]),
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                // Header Section
                VStack(spacing: 8) {
                    Image(systemName: "drop.triangle")
                        .font(.system(size: 40))
                        .foregroundColor(.white)
                        .symbolEffect(.pulse)
                    
                    Text("Clear Wave")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                    
                    Text("Water Ejection System")
                        .font(.system(size: 16))
                        .foregroundColor(.white.opacity(0.8))
                }
                .padding(.top, 20)
                
                Spacer()
                
                // Center Button Section
                ZStack {
                    if isEjecting {
                        WaveAnimationView()
                    }
                    
                    Button(action: {
                        withAnimation(.easeInOut(duration: 0.3)) {
                            if isEjecting {
                                stopEjection()
                            } else {
                                startEjection()
                            }
                        }
                    }) {
                        ZStack {
                            Circle()
                                .fill(isEjecting ? Color.red : Color.white)
                                .frame(width: 200, height: 200)
                                .shadow(radius: 10)
                                .scaleEffect(isEjecting ? 0.95 : 1.0)
                                .opacity(isEjecting ? 0.9 : 1.0)
                            
                            VStack(spacing: 8) {
                                Image(systemName: "speaker.wave.3")
                                    .font(.system(size: 40))
                                    .foregroundColor(isEjecting ? .white : Color(red: 0, green: 0.4, blue: 0.8))
                                
                                Text("EJECT WATER")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(isEjecting ? .white : Color(red: 0, green: 0.4, blue: 0.8))
                            }
                        }
                    }
                    .buttonStyle(PlainButtonStyle())
                }
                .frame(height: 220)
                
                Spacer()
                
                // Controls Section
                VStack(spacing: 20) {
                    VStack(spacing: 12) {
                        HStack {
                            Text("Frequency: \(Int(frequency))Hz")
                                .foregroundColor(.white)
                                .font(.headline)
                            Spacer()
                        }
                        
                        Slider(value: $frequency, in: minFrequency...maxFrequency, step: 5)
                            .accentColor(.cyan)
                    }
                    
                    VStack(spacing: 12) {
                        HStack {
                            Text("Duration: \(Int(duration))s")
                                .foregroundColor(.white)
                                .font(.headline)
                            Spacer()
                        }
                        
                        Slider(value: $duration, in: 30...120, step: 10)
                            .accentColor(.cyan)
                    }
                    
                    HStack {
                        Text("Intensity:")
                            .foregroundColor(.white)
                            .font(.headline)
                        
                        Spacer()
                        
                        Picker("Intensity", selection: $intensity) {
                            Text("Low").tag(0)
                            Text("Medium").tag(1)
                            Text("High").tag(2)
                        }
                        .pickerStyle(SegmentedPickerStyle())
                        .frame(width: 180)
                    }
                    
                    if soundManager.isPlaying {
                        ProgressView(value: soundManager.progress)
                            .progressViewStyle(LinearProgressViewStyle(tint: .cyan))
                            .scaleEffect(y: 2)
                    }
                }
                .padding(.horizontal, 20)
                
                // Info Section
                VStack(spacing: 8) {
                    Text("• Point your phone speaker downward")
                        .foregroundColor(.white.opacity(0.8))
                        .font(.system(size: 14))
                    
                    Text("• Set volume to maximum")
                        .foregroundColor(.white.opacity(0.8))
                        .font(.system(size: 14))
                }
                .padding(.bottom, 30)
            }
        }
    }
    
    private func startEjection() {
        isEjecting = true
        soundManager.startWaterEjection(
            frequency: frequency,
            duration: duration,
            intensity: intensity
        )
    }
    
    private func stopEjection() {
        isEjecting = false
        soundManager.stopWaterEjection()
    }
}

#Preview {
    ContentView()
} 