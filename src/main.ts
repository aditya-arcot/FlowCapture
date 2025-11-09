import fs from 'fs'
import inquirer from 'inquirer'
import { captureAuthState, executeSteps } from './utilities/browserExecutor.js'
import { logger } from './utilities/logger.js'
import { getAutomationSteps } from './utilities/openaiClient.js'
import { createTutorial } from './utilities/tutorialGenerator.js'

async function main() {
    // Agent A - get task from user, authenticate
    const { task } = await inquirer.prompt([
        {
            name: 'task',
            message: 'What task do you want a tutorial for?',
            type: 'input',
        },
    ])
    logger.info('Processing task: %s', task)

    logger.info('Capturing authentication state')
    await captureAuthState()

    // Agent B - create plan, execute steps, save screenshots
    logger.info('Generating plan')
    const steps = await getAutomationSteps(task)
    if (steps.length === 0) {
        logger.error('No valid steps returned from model')
        return
    }

    const outputDir = `output/${Date.now()}`
    const screenshotsDir = `${outputDir}/screenshots`
    if (!fs.existsSync(screenshotsDir)) {
        fs.mkdirSync(screenshotsDir, { recursive: true })
    }

    logger.info('Executing in Playwright')
    const screenshots = await executeSteps(steps, screenshotsDir)

    logger.info('Generating tutorial document')
    createTutorial(task, steps, screenshots, outputDir)
}

void main()
