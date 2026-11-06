// Screens only hide what a role can't use. The API makes the real check on every call.
export const can = (permissions: string[], code: string) => permissions.includes(code)
