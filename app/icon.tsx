import { ImageResponse } from 'next/og'
import AppIcon from '../components/brand/AppIcon'

// Android and the install prompt use this size. Replace with a logo file later.
export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(<AppIcon size={size.width} />, { ...size })
}
