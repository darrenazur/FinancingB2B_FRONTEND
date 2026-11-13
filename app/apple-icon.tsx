import { ImageResponse } from 'next/og'
import AppIcon from '../components/brand/AppIcon'

// The iPhone home screen icon. Replace with a logo file later.
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(<AppIcon size={size.width} />, { ...size })
}
