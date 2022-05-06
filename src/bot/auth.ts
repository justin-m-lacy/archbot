export type Auth = {

    token: string,
    owner: string,
    admins?: string[],
    dev?: {
        token: string
    }
}