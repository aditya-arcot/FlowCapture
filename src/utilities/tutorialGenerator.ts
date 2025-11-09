import fs from 'fs'
import path from 'path'
import { ActionStep } from '../models/actionStep.js'
import { logger } from './logger.js'

export const createTutorial = (
    task: string,
    steps: ActionStep[],
    screenshots: (string | null)[],
    outputDir: string
) => {
    const tutorialLines: string[] = [
        `# Tutorial - ${task}`,
        'This document captures each automated step and a screenshot after its execution.',
    ]

    let stepNum = 1
    steps.forEach((step, idx) => {
        if (screenshots[idx] === null) return
        tutorialLines.push(`## Step ${stepNum} - ${step.description}`)
        if (screenshots[idx])
            tutorialLines.push(
                `<img src=screenshots/${path.basename(screenshots[idx])} width=750>`
            )
        stepNum++
    })

    const outputFile = path.join(outputDir, 'tutorial.md')
    fs.writeFileSync(outputFile, tutorialLines.join('\n\n'))
    logger.info('Tutorial document created at %s', outputFile)
}
