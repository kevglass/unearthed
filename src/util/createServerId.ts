import { customAlphabet } from "nanoid";

export function createServerId(): string {
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    return customAlphabet(alphabet, 5)()
}
