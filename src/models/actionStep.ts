export interface ActionStep {
    action: 'navigate' | 'click' | 'input'
    descriptors?: string[]
    value?: string
    url?: string
    description?: string
}
