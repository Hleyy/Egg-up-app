const cache = new Map<string, Promise<boolean>>()

export function assetExists(src: string, magic: string): Promise<boolean> {
  let found = cache.get(src)
  if (!found) {
    found = fetch(src)
      .then(async (res) => {
        if (!res.ok) return false
        const head = new Uint8Array(await res.arrayBuffer()).slice(0, magic.length)
        return String.fromCharCode(...head) === magic
      })
      .catch(() => false)
    cache.set(src, found)
  }
  return found
}
