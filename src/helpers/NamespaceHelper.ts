export function shorterKey(key: string): string {
    if (key.startsWith('minecraft:')) {
        return key.substr(10);
    }
    return key;
}
