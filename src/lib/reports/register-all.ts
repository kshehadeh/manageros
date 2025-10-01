'use server'

import { registerReport } from './registry'
import { PersonOverviewReport } from './person-overview'
import { PersonAiSynopsisReport } from './person-ai-synopsis'

// Register all built-in reports here
registerReport(PersonOverviewReport)
registerReport(PersonAiSynopsisReport)
