import {
  Zap, Trash2, Ghost, Coffee, Moon, Battery,
  Lock, Unlock, Maximize, Wifi, EyeOff, RefreshCw
} from 'lucide-react';

export const TOOLS_DATA = [
  {
    id: 'speed',
    title: 'Speed Up',
    desc: 'Everything feels faster.',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    // CHANGED: Using '&&' ensures sequential execution
    cmd: 'settings put global window_animation_scale 0.5 && settings put global transition_animation_scale 0.5 && settings put global animator_duration_scale 0.5'
  },
  {
    id: 'clean',
    title: 'Clean Space',
    desc: 'Removes junk files.',
    icon: Trash2,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    cmd: 'pm trim-caches 999G'
  },
  {
      id: 'ghost',
      title: 'Black & White',
      desc: 'No colors.',
      icon: Ghost,
      color: 'text-gray-400',
      bg: 'bg-gray-400/10',
      // FIX: Set value to 0 (Monochrome) FIRST, then turn it ON (1).
      // We also toggle it off/on quickly to force a refresh.
      cmd: 'settings put secure accessibility_display_daltonizer 0 && settings put secure accessibility_display_daltonizer_enabled 1'
    },
  {
    id: 'caffeine',
    title: 'Stay Awake',
    desc: 'Screen stays on.',
    icon: Coffee,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    cmd: 'settings put global stay_on_while_plugged_in 3'
  },
  {
    id: 'kill',
    title: 'Close Apps',
    desc: 'Clears memory.',
    icon: Moon,
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
    cmd: 'am kill-all'
  },
  {
    id: 'battery',
    title: 'Save Power',
    desc: 'Uses less battery.',
    icon: Battery,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    cmd: 'settings put global low_power 1'
  },
  {
    id: 'privacy_lock',
    title: 'Block Camera',
    desc: 'Camera & mic off.',
    icon: Lock,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    // TRY THIS: 'cmd sensor_privacy' is better for Android 12+, 'service call' is for older.
    // We try both joined by ; (ignore failure)
    cmd: 'cmd sensor_privacy enable 0 microphone && cmd sensor_privacy enable 0 camera'
  },
  {
    id: 'privacy_open',
    title: 'Allow Camera',
    desc: 'Camera & mic on.',
    icon: Unlock,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    cmd: 'cmd sensor_privacy disable 0 microphone && cmd sensor_privacy disable 0 camera'
  },
  {
    id: 'immersive',
    title: 'Full Screen',
    desc: 'Hide system bars.',
    icon: Maximize,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
    cmd: 'settings put global policy_control immersive.full=*'
  },
  {
    id: 'wifi',
    title: 'Wireless ADB',
    desc: 'No cable needed.',
    icon: Wifi,
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
    cmd: 'tcpip 5555'
  },
  {
    id: 'doze',
    title: 'Deep Sleep',
    desc: 'Force idle mode.',
    icon: EyeOff,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    cmd: 'dumpsys deviceidle force-idle'
  },
  {
    id: 'reset',
    title: 'Reset Screen',
    desc: 'Fix display.',
    icon: RefreshCw,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    cmd: 'wm density reset && wm size reset && settings put global policy_control null && settings put secure accessibility_display_daltonizer_enabled 0 && settings put global stay_on_while_plugged_in 0'
  }
];