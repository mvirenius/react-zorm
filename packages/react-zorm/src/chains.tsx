import type { ZodIssue } from "zod";
import { SimpleSchema, ErrorChainFromSchema } from "./types";

export function fieldChain(ns: string): any {
    return new Proxy(
        {},
        {
            get(_target, prop) {
                return _fieldChain(ns, [])[prop];
            },
        },
    );
}

function _fieldChain(ns: string, path: readonly string[]) {
    const proxy: any = new Proxy(() => {}, {
        apply(_target, _thisArg, args) {
            if (typeof args[0] === "number") {
                const last = path[path.length - 1];

                return _fieldChain(ns, [
                    ...path.slice(0, -1),
                    `${last}[${args[0]}]`,
                ]);
            }

            if (args[0] === "id") {
                return ns + ":" + path.join(".");
            }

            return path.join(".");
        },

        get(_target, prop) {
            if (typeof prop === "string") {
                return _fieldChain(ns, [...path, prop]);
            }

            return _fieldChain(ns, path);
        },
    });

    return proxy;
}

export function errorChain<T extends SimpleSchema>(
    issues: ZodIssue[] | undefined,
): ErrorChainFromSchema<T> {
    return new Proxy(
        {},
        {
            get(_target, prop) {
                return _errorChain(issues, [])[prop];
            },
        },
    ) as any;
}

function arrayEquals(a: readonly any[], b: readonly any[]) {
    return (
        a.length === b.length &&
        a.every((item, index) => {
            return item === b[index];
        })
    );
}

function _errorChain(
    issues: ZodIssue[] | undefined,
    path: readonly (string | number)[],
) {
    const proxy: any = new Proxy(() => {}, {
        apply(_target, _thisArg, args) {
            if (typeof args[0] === "number") {
                return _errorChain(issues, [...path, args[0]]);
            }

            const issue = issues?.find((issue) => {
                return arrayEquals(issue.path, path);
            });

            if (args[0] === Boolean) {
                return Boolean(issue);
            }

            if (typeof args[0] === "function") {
                if (issue) {
                    return args[0](issue);
                }

                return undefined;
            }

            if (args[0]) {
                if (issue) {
                    return args[0];
                } else {
                    return undefined;
                }
            }

            return issue || undefined;
        },

        get(_target, prop) {
            if (typeof prop === "string") {
                return _errorChain(issues, [...path, prop]);
            }

            return _errorChain(issues, path);
        },
    });

    return proxy;
}
