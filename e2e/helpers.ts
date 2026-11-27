import { expect, type Page } from '@playwright/test'

export async function seedRandom(page: Page, seed = 7) {
  await page.addInitScript((start) => {
    let a = start
    Math.random = () => {
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
  }, seed)
}

export async function openFresh(page: Page) {
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.reload()
}

export async function startGame(page: Page, mode: '4 players' | 'Whole class' = '4 players') {
  await page.getByRole('button', { name: 'New game' }).click()
  await page.getByRole('radio', { name: new RegExp(mode, 'i') }).click()
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Who starts?' })).toBeVisible()
  const lets = page.getByRole('button', { name: "Let's play" })
  for (let i = 0; i < 12 && !(await lets.isVisible()); i++) {
    await page
      .getByRole('button', { name: /Roll the dice/ })
      .first()
      .click()
    await page.waitForTimeout(1600)
  }
  await lets.click()
  await expect(page.getByRole('button', { name: 'Roll the dice' }).last()).toBeVisible()
}

const NEXT = /^(Hatch the egg|Draw a card|Right|Red team|Keep it|Use now|Great!|OK, apply|Continue|Tap the egg)$/

export async function playTurn(page: Page) {
  const roll = page.getByRole('button', { name: 'Roll the dice', exact: true }).last()
  await roll.click()
  await expect(page.getByRole('button', { name: /Draw a card|Hatch the egg/ })).toBeVisible({ timeout: 8000 })
  for (let i = 0; i < 14; i++) {
    if (page.url().endsWith('/end')) return
    if (await roll.isVisible()) return
    const next = page.getByRole('button', { name: NEXT }).first()
    if (await next.isVisible()) await next.click()
    await page.waitForTimeout(350)
  }
}
