import Foundation
import AVFoundation
import SwiftUI

class SoundManager: ObservableObject {
    private var audioEngine: AVAudioEngine?
    private var playerNode: AVAudioPlayerNode?
    private var timer: Timer?
    private var progressTimer: Timer?
    
    @Published var isPlaying: Bool = false
    @Published var progress: Double = 0.0
    
    private var currentDuration: Double = 30
    private var startTime: Date?
    
    init() {
        setupAudioSession()
    }
    
    deinit {
        stopWaterEjection()
    }
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .default, options: [.defaultToSpeaker])
            try audioSession.setActive(true)
        } catch {
            print("Audio session setup failed: \(error)")
        }
    }
    
    func startWaterEjection(frequency: Double, duration: Double, intensity: Int) {
        stopWaterEjection() // Stop any existing playback
        
        currentDuration = duration
        startTime = Date()
        
        DispatchQueue.main.async {
            self.isPlaying = true
            self.progress = 0.0
        }
        
        setupAudioEngine()
        startProgressTimer()
        cycleTones(baseFrequency: frequency, intensity: intensity)
        
        // Auto-stop after duration
        timer = Timer.scheduledTimer(withTimeInterval: duration, repeats: false) { _ in
            self.stopWaterEjection()
        }
    }
    
    func stopWaterEjection() {
        timer?.invalidate()
        timer = nil
        
        progressTimer?.invalidate()
        progressTimer = nil
        
        audioEngine?.stop()
        audioEngine = nil
        playerNode = nil
        
        DispatchQueue.main.async {
            self.isPlaying = false
            self.progress = 0.0
        }
    }
    
    private func setupAudioEngine() {
        audioEngine = AVAudioEngine()
        playerNode = AVAudioPlayerNode()
        
        guard let engine = audioEngine, let player = playerNode else { return }
        
        engine.attach(player)
        engine.connect(player, to: engine.mainMixerNode, format: nil)
        
        do {
            try engine.start()
        } catch {
            print("Audio engine start failed: \(error)")
        }
    }
    
    private func startProgressTimer() {
        progressTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { _ in
            guard let startTime = self.startTime else { return }
            
            let elapsed = Date().timeIntervalSince(startTime)
            let newProgress = min(elapsed / self.currentDuration, 1.0)
            
            DispatchQueue.main.async {
                self.progress = newProgress
            }
        }
    }
    
    private func cycleTones(baseFrequency: Double, intensity: Int) {
        let frequencies = [baseFrequency, 2000.0] // Base frequency and high frequency
        var currentIndex = 0
        
        func playNextTone() {
            guard isPlaying else { return }
            
            let frequency = frequencies[currentIndex]
            generateTone(frequency: frequency, duration: 30.0, intensity: intensity)
            
            currentIndex = (currentIndex + 1) % frequencies.count
            
            // Schedule next tone after 30 seconds on + 5 seconds pause
            DispatchQueue.main.asyncAfter(deadline: .now() + 35.0) {
                playNextTone()
            }
        }
        
        playNextTone()
    }
    
    private func generateTone(frequency: Double, duration: Double, intensity: Int) {
        guard let player = playerNode, let engine = audioEngine, isPlaying else { return }
        
        let sampleRate: Double = 44100
        let frameCount = AVAudioFrameCount(sampleRate * 30.0) // 30 seconds of audio
        
        guard let buffer = AVAudioPCMBuffer(pcmFormat: engine.mainMixerNode.outputFormat(forBus: 0), frameCapacity: frameCount) else {
            return
        }
        
        buffer.frameLength = frameCount
        
        let channels = Int(buffer.format.channelCount)
        let amplitude = getAmplitude(for: intensity)
        
        for channel in 0..<channels {
            let channelData = buffer.floatChannelData?[channel]
            
            for frame in 0..<Int(frameCount) {
                let time = Double(frame) / sampleRate
                let sample = Float(sin(2.0 * Double.pi * frequency * time) * amplitude)
                channelData?[frame] = sample
            }
        }
        
        player.scheduleBuffer(buffer, at: nil, options: [], completionHandler: nil)
        
        if !player.isPlaying {
            player.play()
        }
    }
    
    private func getAmplitude(for intensity: Int) -> Double {
        switch intensity {
        case 0: return 0.3 // Low
        case 1: return 0.6 // Medium
        case 2: return 0.9 // High
        default: return 0.6
        }
    }
} 