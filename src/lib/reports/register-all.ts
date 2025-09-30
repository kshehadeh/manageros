'use server'

import { registerReport } from './registry'
import { PersonOverviewReport } from './person-overview'

// Register all built-in reports here
registerReport(PersonOverviewReport)

