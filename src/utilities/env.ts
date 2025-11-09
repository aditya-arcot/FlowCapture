import { env } from 'process'

const getEnvVar = (key: string): string => {
    const val = env[key]
    if (val === undefined) throw Error(`missing env var ${key}`)
    return val
}

export const vars = {
    logLevel: getEnvVar('LOG_LEVEL'),
    openaiApiKey: getEnvVar('OPENAI_API_KEY'),
}
