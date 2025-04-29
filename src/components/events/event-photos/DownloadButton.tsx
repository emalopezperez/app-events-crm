'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export default function DownloadButton() {
  return (
    <form>
      <Button type="submit" className="bg-[#3a3a4a] hover:bg-[#4a4a5a]">
        <Download className="mr-2 h-4 w-4" />
        Download All Photos
      </Button>
    </form>
  )
}
