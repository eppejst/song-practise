'use client'

import { useCallback } from 'react'
import { getAudio } from './useAudio'

// Module-level singletons — must not be recreated across renders
let _audioCtx: AudioContext | null = null
let _gainL: GainNode | null = null
let _gainR: GainNode | null = null
let _graphReady = false

/**
 * Must be called directly from a user-gesture handler (e.g. play button onClick).
 * iOS blocks AudioContext creation unless triggered synchronously by user input.
 */
function ensureAudioGraph(): void {
  if (_graphReady) return
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext || AudioContext
    _audioCtx = new AudioCtx()
    const audio = getAudio()
    const source = _audioCtx.createMediaElementSource(audio)
    const splitter = _audioCtx.createChannelSplitter(2)
    const merger = _audioCtx.createChannelMerger(2)
    _gainL = _audioCtx.createGain()
    _gainR = _audioCtx.createGain()

    source.connect(splitter)
    splitter.connect(_gainL, 0)
    _gainL.connect(merger, 0, 0)
    splitter.connect(_gainR, 1)
    _gainR.connect(merger, 0, 1)
    merger.connect(_audioCtx.destination)

    _graphReady = true
  } catch (e) {
    console.warn('Web Audio API unavailable:', e)
  }
}

function resumeCtx(): void {
  if (_audioCtx && _audioCtx.state === 'suspended') {
    _audioCtx.resume().catch(console.error)
  }
}

export function useWebAudio() {
  const setChannelGain = useCallback((channel: 'L' | 'R', value: number) => {
    const node = channel === 'L' ? _gainL : _gainR
    if (node) node.gain.value = value
  }, [])

  const getChannelGain = useCallback((channel: 'L' | 'R'): number => {
    const node = channel === 'L' ? _gainL : _gainR
    return node?.gain.value ?? 1
  }, [])

  return { ensureAudioGraph, resumeCtx, setChannelGain, getChannelGain }
}
