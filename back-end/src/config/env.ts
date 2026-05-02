// config/env.ts
function getEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing env: ${name}`);
    }
    return value;
}

export const env = {
    JWT_SECRET: getEnv("JWT_SECRET"),
};