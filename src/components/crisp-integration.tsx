'use client'

import { useEffect } from 'react'
import { Crisp } from 'crisp-sdk-web'

interface CrispIntegrationProps {
  hideButton?: boolean
}

const CRISP_WEBSITE_ID = '753eccea-4739-4c62-856f-c1f7c6956aae'

export function CrispIntegration({
  hideButton = false,
}: CrispIntegrationProps) {
  useEffect(() => {
    // Configure Crisp
    Crisp.configure(CRISP_WEBSITE_ID, {
      autoload: true,
    })

    // Hide the chat button if requested
    if (hideButton) {
      Crisp.chat.hide()
    }

    // Cleanup function
    return () => {
      // No cleanup needed for Crisp SDK
    }
  }, [hideButton])

  return null
}
