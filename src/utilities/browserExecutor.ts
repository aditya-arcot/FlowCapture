import fs from 'fs'
import inquirer from 'inquirer'
import path from 'path'
import { chromium, Page } from 'playwright'
import { ActionStep } from '../models/actionStep.js'
import { logger } from './logger.js'

const storageStateFile = 'authState.json'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const buildDescriptorRegex = (descriptors: string[]) => {
    return new RegExp(`^(${descriptors.join('|')})$`, 'i')
}

export const captureAuthState = async () => {
    const browser = await chromium.launch({ headless: false })

    let context
    if (fs.existsSync(storageStateFile))
        context = await browser.newContext({ storageState: storageStateFile })
    else context = await browser.newContext()

    const page = await context.newPage()
    await page.setViewportSize({ width: 1512, height: 982 })
    await sleep(500)

    logger.info(
        'A browser window has been opened. Please log into your account.'
    )
    await sleep(2000)

    await inquirer.prompt([
        {
            type: 'input',
            message:
                'Press Enter once you have completed the login process in the browser.',
        },
    ])

    await context.storageState({ path: storageStateFile })
    logger.info('Authentication state saved to %s', storageStateFile)

    await browser.close()
}

export const executeSteps = async (steps: ActionStep[], outputDir: string) => {
    const browser = await chromium.launch({ headless: false })
    const context = await browser.newContext({ storageState: storageStateFile })
    const page = await context.newPage()

    let index = 0
    const screenshots: (string | null)[] = []
    for (const step of steps) {
        logger.info(
            `Executing step %d: %s`,
            index,
            step.description || step.action
        )

        try {
            if (step.action === 'navigate')
                await handleNavigateAction(page, step)
            else if (step.action === 'click')
                await handleClickAction(page, step)
            else if (step.action === 'input')
                await handleInputAction(page, step)
            else throw Error(`Unknown action: ${step.action}`)

            await sleep(1500)
            const screenshotPath = path.join(outputDir, `step_${index}.png`)
            screenshots.push(screenshotPath)
            await page.screenshot({ path: screenshotPath })
            await sleep(1500)
        } catch (err) {
            logger.error('Error executing step %d: %s', index, err)
            screenshots.push(null)
        }

        index++
    }

    await browser.close()
    return screenshots
}

const handleNavigateAction = async (page: Page, step: ActionStep) => {
    if (!step.url) throw Error('navigate action requires a url')
    logger.debug('Navigating to URL: %s', step.url)
    await page.goto(step.url)
}

const handleClickAction = async (page: Page, step: ActionStep) => {
    if (!step.descriptors) throw Error('click action requires descriptors')
    logger.debug('Attempting to click element matching %s', step.descriptors)

    const regex = buildDescriptorRegex(step.descriptors)
    const strategies = [
        { name: 'button', locator: page.getByRole('button', { name: regex }) },
        { name: 'link', locator: page.getByRole('link', { name: regex }) },
        { name: 'text', locator: page.getByText(regex) },
        { name: 'label', locator: page.getByLabel(regex) },
    ]

    let returned = false
    for (const { name, locator } of strategies) {
        try {
            logger.trace('Trying to click using %s strategy', name)
            await locator.first().click({ timeout: 2000 })
            logger.debug('Clicked element using %s strategy', name)
            returned = true
            return
        } catch (err) {
            if (!returned)
                logger.trace(
                    'Strategy "%s" failed: %s',
                    name,
                    (err as Error).message
                )
        }
    }

    throw Error('All click strategies failed')
}

const handleInputAction = async (page: Page, step: ActionStep) => {
    if (!step.value) throw Error('input action requires a value')

    if (!step.descriptors) {
        logger.debug(
            'Attempting to fill input without descriptors with value %s',
            step.value
        )
        await page.keyboard.type(step.value)
        return
    }

    logger.debug(
        'Attempting to fill input element matching %s with value %s',
        step.descriptors,
        step.value
    )

    const regex = buildDescriptorRegex(step.descriptors)
    const strategies = [
        { name: 'placeholder', locator: page.getByPlaceholder(regex) },
        { name: 'label', locator: page.getByLabel(regex) },
        {
            name: 'textbox',
            locator: page.getByRole('textbox', { name: regex }),
        },
    ]

    let returned = false
    for (const { name, locator } of strategies) {
        try {
            logger.trace('Trying to fill using %s strategy', name)
            await locator.first().fill(step.value, { timeout: 2000 })
            logger.debug('Filled input using %s strategy', name)
            returned = true
            return
        } catch (err) {
            if (!returned)
                logger.trace(
                    'Strategy "%s" failed: %s',
                    name,
                    (err as Error).message
                )
        }
    }
    throw Error('All input fill strategies failed')
}
