import fs from 'fs'
import os from 'os'
import path from 'path'
import pino from 'pino'
import { vars } from './env.js'

interface PinoTarget {
    target: string
    level: string
    options: object
}
const targets: PinoTarget[] = [
    {
        target: 'pino-pretty',
        level: vars.logLevel,
        options: {
            colorize: true,
        },
    },
]

const logDirectory = path.resolve(os.homedir(), 'Projects', 'Logs')
const fileName = 'flowcapture.log'
const logPath = path.join(logDirectory, fileName)

if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory, { recursive: true })
}

targets.push({
    target: 'pino/file',
    level: 'trace',
    options: {
        destination: logPath,
    },
})

export const logger = pino({
    level: vars.logLevel,
    transport: { targets },
})
