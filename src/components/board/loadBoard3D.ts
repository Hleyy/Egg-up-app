export const loadBoard3D = () => import('./Board3D')

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export function preloadBoard() {
  if (hasWebGL()) void loadBoard3D()
}
