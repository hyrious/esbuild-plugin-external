// @ts-ignore
import { useState } from 'react'

export function App() {
  const [s] = useState(0)
  return s
}

import * as mod from '..' with { external: "./index.js" }

mod.external()

// @ts-ignore
import { foo } from '../foo.js'

foo()
