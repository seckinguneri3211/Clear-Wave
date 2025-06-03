import SwiftUI

struct WaveAnimationView: View {
    @State private var animate = false
    
    var body: some View {
        ZStack {
            ForEach(0..<4, id: \.self) { index in
                Circle()
                    .stroke(
                        LinearGradient(
                            gradient: Gradient(colors: [
                                Color.cyan.opacity(0.8),
                                Color.blue.opacity(0.4),
                                Color.clear
                            ]),
                            startPoint: .center,
                            endPoint: .trailing
                        ),
                        lineWidth: 2
                    )
                    .frame(width: 50, height: 50)
                    .scaleEffect(animate ? 4.0 : 0.5)
                    .opacity(animate ? 0.0 : 1.0)
                    .animation(
                        Animation
                            .easeOut(duration: 1.5)
                            .repeatForever(autoreverses: false)
                            .delay(Double(index) * 0.3),
                        value: animate
                    )
            }
        }
        .onAppear {
            animate = true
        }
        .onDisappear {
            animate = false
        }
    }
}

struct PulseAnimationView: View {
    @State private var isPulsing = false
    
    var body: some View {
        Circle()
            .fill(Color.cyan.opacity(0.3))
            .frame(width: 200, height: 200)
            .scaleEffect(isPulsing ? 1.2 : 1.0)
            .opacity(isPulsing ? 0.3 : 0.6)
            .animation(
                Animation
                    .easeInOut(duration: 1.0)
                    .repeatForever(autoreverses: true),
                value: isPulsing
            )
            .onAppear {
                isPulsing = true
            }
    }
}

#Preview {
    ZStack {
        Color.black.ignoresSafeArea()
        WaveAnimationView()
    }
} 