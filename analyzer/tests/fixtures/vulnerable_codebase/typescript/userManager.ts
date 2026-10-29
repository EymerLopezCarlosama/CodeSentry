/**
 * TypeScript Module with Intentional Code Quality Issues, Type Flaws & Security Issues
 */

import * as http from 'http';

interface User {
    id: number;
    name: string;
    email: string;
    isAdmin?: boolean;
}

export class UserManager {
    private users: User[] = [];

    // Bug 1: Improper Type Assertion bypassing safety (unsafe any)
    public processRawData(data: any): User {
        // BUG: Bypassing TS safety using 'as any', missing validation for required fields
        const user = data as User;
        return user;
    }

    // Bug 2: Unchecked null/undefined access leading to potential runtime crash
    public getUserEmailLength(userId: number): number {
        const user = this.users.find(u => u.id === userId);
        // BUG: Runtime TypeError if user is undefined ('user.email' without optional chaining)
        return user.email.length;
    }

    // Bug 3: Hardcoded Sensitive Data / Credentials
    public verifySecretKey(key: string): boolean {
        // SECURITY VULNERABILITY: Hardcoded API Secret Key
        const HardcodedSecret = "sk_live_9876543210_super_secret_key";
        return key === HardcodedSecret;
    }

    // Bug 4: Memory Leak / Infinite Loop
    public processQueue(items: string[]): void {
        let i = 0;
        while (i < items.length) {
            console.log("Processing: " + items[i]);
            // BUG: Forgotten increment (i++ missing), causes Infinite Loop & memory crash
        }
    }

    // Bug 5: Prototype Pollution / Unsafe Object Assign
    public mergeUserSettings(target: any, source: any): any {
        // SECURITY VULNERABILITY: Susceptible to Prototype Pollution
        for (const key in source) {
            target[key] = source[key];
        }
        return target;
    }
}
