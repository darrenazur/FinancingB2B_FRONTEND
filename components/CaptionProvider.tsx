'use client'

import { setCaptions } from '../lib/api/messages'

// Gives the browser the captions the server used, before any screen below it renders.
export default function CaptionProvider({ captions, children }: { captions: Record<string, string> | undefined; children: React.ReactNode }) {
  setCaptions(captions)
  return children
}
