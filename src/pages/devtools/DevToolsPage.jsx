import { useState } from 'react'
import { Code2, Palette, Blend, Braces, Fingerprint, Binary } from 'lucide-react'
import { PageHeader, Tabs } from '@/components/ui'
import SnippetsTool from './SnippetsTool'
import ColorPaletteTool from './ColorPaletteTool'
import GradientTool from './GradientTool'
import JsonFormatterTool from './JsonFormatterTool'
import UuidTool from './UuidTool'
import Base64Tool from './Base64Tool'

const TABS = [
  { value: 'snippets', label: 'Snippets', icon: Code2 },
  { value: 'colors', label: 'Colors', icon: Palette },
  { value: 'gradient', label: 'Gradient', icon: Blend },
  { value: 'json', label: 'JSON', icon: Braces },
  { value: 'uuid', label: 'UUID', icon: Fingerprint },
  { value: 'base64', label: 'Base64', icon: Binary },
]

export default function DevToolsPage() {
  const [tab, setTab] = useState('snippets')
  return (
    <div>
      <PageHeader title="Dev Tools" description="Small utilities for everyday development work." />
      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-5 flex-wrap h-auto" />
      {tab === 'snippets' && <SnippetsTool />}
      {tab === 'colors' && <ColorPaletteTool />}
      {tab === 'gradient' && <GradientTool />}
      {tab === 'json' && <JsonFormatterTool />}
      {tab === 'uuid' && <UuidTool />}
      {tab === 'base64' && <Base64Tool />}
    </div>
  )
}
