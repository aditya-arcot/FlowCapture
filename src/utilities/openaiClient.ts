// eslint-disable-next-line @typescript-eslint/naming-convention
import OpenAI from 'openai'
import { ActionStep } from '../models/actionStep.js'
import { vars } from './env.js'
import { logger } from './logger.js'

const instructions = `
You are an expert assistant that translates user requests into step-by-step web automation instructions.
Convert the user's task into a list of actionable automation steps.
This list will be used to automate interactions with a web application using Playwright to generate a tutorial.
The steps must be specific, detailed, and executable without further clarification.
Return the steps as a JSON array and include nothing else.

Each step should include:
- action: one of "navigate", "click", or "input".
- description: a brief description of the step.

Additionally, include the following fields based on the action type:
- navigate: url field (string; pointing to a real, existing page).
- click: descriptors field (string array; multiple, case-insensitive ways to identify the element).
- input: optional descriptors field, value field (string; the input value).

Descriptors are used to locate elements by Playwright; use text, labels, names, or roles that are likely to be relevant.
They will be used to create a regular expression that will be used in functions like getByRole, getByText, and getByLabel.
When descriptors are not provided for input actions, the input will be entered into the currently focused element.

For example, see the following steps for a tutorial on creating a new page in Notion:
[
    {
        action: 'navigate',
        url: 'https://www.notion.so/',
        description: 'Navigate to the Notion home page',
    },
    {
        action: 'click',
        descriptors: ['new page'],
        description: 'Click on New Page to create a new page',
    },
    {
        action: 'input',
        value: 'Demo Page',
        description: 'Enter a title for the new page',
    }
]

Important notes:
- Skip any authentication, login, or credential-entry steps; assume the user is already logged in and has a valid session.
- Assume referenced resources (databases, pages, properties) do not exist and must be created first.
- Use real URLs and values; do not use placeholders like "your-database".
- Ensure all steps are explicit and actionable, so that the steps can be executed immediately.
`.trim()

const client = new OpenAI({ apiKey: vars.openaiApiKey })

export const getAutomationSteps = async (
    task: string
): Promise<ActionStep[]> => {
    let response
    try {
        response = await client.responses.create({
            model: 'gpt-4o',
            instructions,
            input: task,
        })
        logger.debug({ response })
    } catch (err) {
        logger.error('OpenAI API error: %s', err)
        return []
    }

    const cleaned = response.output_text
        .replace(/```json\s*/i, '') // remove ```json or ```JSON
        .replace(/```$/, '') // remove closing ```
        .trim()
    logger.debug('Cleaned output: %s', cleaned)

    try {
        return JSON.parse(cleaned)
    } catch (err) {
        logger.error('Failed to parse model output: %s', err)
        return []
    }
}
