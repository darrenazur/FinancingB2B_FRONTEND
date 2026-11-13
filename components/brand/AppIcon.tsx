// The home screen icon until there is a logo: the sidebar's AZUR mark, white on the accent blue.
// Drawn by next/og, which supports inline styles only. The phone rounds the corners itself.
export default function AppIcon({ size }: { size: number }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#2563eb',
        color: '#ffffff',
        fontSize: Math.round(size * 0.26),
        fontWeight: 700,
        letterSpacing: Math.round(size * 0.01),
      }}
    >AZUR</div>
  )
}
