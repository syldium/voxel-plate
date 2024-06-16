export function shorterKey(key: string): string {
    if (key.startsWith('minecraft:')) {
        return key.substring(10);
    }
    return key;
}
