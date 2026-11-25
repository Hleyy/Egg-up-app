import { useState } from 'react'
import { QrCode } from '../components/QrCode'
import { BackButton, Btn, Flags, Page, Scene, TopBar } from '../components/ui'
import { useSettings } from '../settings/useSettings'

export function ShareScreen() {
  const { t } = useSettings()
  const [copied, setCopied] = useState(false)
  const url = window.location.origin
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Page>
      <Scene season="spring" />
      <TopBar left={<BackButton />} right={<Flags />} />
      <div className="flex flex-1 flex-col justify-center py-6">
        <section className="tile anim-pop mx-auto w-full max-w-[360px] p-5 text-center">
          <img src="/brand/logo.svg" alt="" className="mx-auto -mt-1 w-[46%]" />
          <h1 className="font-display text-ink mt-2 text-[26px] leading-tight">{t('share.title')}</h1>
          <p className="text-sub mt-1 text-[15px]">{t('share.subtitle')}</p>
          <div className="relative mx-auto mt-4 w-[78%] rounded-[26px] bg-white p-3 shadow-[inset_0_0_0_3px_#E3FFCF,0_5px_0_#C6F0A6]">
            <QrCode value={url} className="block w-full" />
          </div>
          <p className="font-display text-green mt-3 truncate text-[15px]">{url.replace(/^https?:\/\//, '')}</p>
        </section>
        <Btn color="white" className="stagger mx-auto mt-5 w-full max-w-[360px]" style={{ ['--i' as string]: 2 }} onClick={copy}>
          {copied ? t('share.copied') : t('share.copy')}
        </Btn>
      </div>
    </Page>
  )
}
