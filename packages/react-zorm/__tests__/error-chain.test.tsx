import { z } from "zod";
import { assertIs, assertNotNil } from "@valu/assert";
import { errorChain } from "../src/chains";
import { assertNotAny } from "./test-helpers";
import { ErrorChain } from "../src/types";

test("can get error", () => {
    const Schema = z.object({
        field: z.string(),
    });

    const res = Schema.safeParse({});
    assertIs(res.success, false as const);

    const chain = errorChain<typeof Schema>(res.error.issues);

    expect(chain.field()).toEqual({
        code: "invalid_type",
        expected: "string",
        received: "undefined",
        path: ["field"],
        message: "Required",
    });
});

test("can get boolean true on error", () => {
    const Schema = z.object({
        field: z.string(),
    });

    const res = Schema.safeParse({});
    assertIs(res.success, false as const);

    const chain = errorChain<typeof Schema>(res.error.issues);

    expect(chain.field(Boolean)).toBe(true);
});

test("can get boolean false on success", () => {
    const Schema = z.object({
        field: z.string(),
    });

    const chain = errorChain<typeof Schema>(undefined);

    expect(chain.field(Boolean)).toBe(false);
});

test("can use custom value", () => {
    const Schema = z.object({
        field: z.string(),
    });

    const res = Schema.safeParse({});
    assertIs(res.success, false as const);

    const chain = errorChain<typeof Schema>(res.error.issues);

    expect(chain.field({ my: "thing" })).toEqual({
        my: "thing",
    });
});

test("can use custom value in fn", () => {
    const Schema = z.object({
        field: z.string(),
    });

    const res = Schema.safeParse({});
    assertIs(res.success, false as const);

    const chain = errorChain<typeof Schema>(res.error.issues);

    expect(chain.field(() => ({ my: "thing" }))).toEqual({
        my: "thing",
    });
});

test("can get refined object error", () => {
    const Schema = z.object({
        pw: z
            .object({
                password: z.string(),
                password2: z.string(),
            })
            .refine(
                (val) => {
                    return val.password === val.password2;
                },
                { message: "Passwords do not match" },
            ),
    });

    const res = Schema.safeParse({
        pw: {
            password: "foo",
            password2: "bar",
        },
    });
    assertIs(res.success, false as const);

    const chain = errorChain<typeof Schema>(res.error.issues);

    expect(chain.pw()).toEqual({
        code: "custom",
        message: "Passwords do not match",
        path: ["pw"],
    });
});

export function typeChecks() {
    {
        const Schema = z.object({
            field: z.string(),
            list: z.array(z.string()),
            objectList: z.array(
                z.object({
                    nested: z.string(),
                }),
            ),
        });

        const chain = errorChain<typeof Schema>(undefined);

        // @ts-expect-error
        chain.list();

        chain.list(0)();

        {
            // Returns the number on normal field
            // @ts-expect-error
            const _: ErrorChain<any> = chain.field(3);
        }

        {
            // array index set returns the chain again
            const _: ErrorChain<any> = chain.objectList(3);
            assertNotAny(chain.objectList(3));
        }

        {
            const _: string | undefined = chain.field("");
            assertNotAny(chain.field(""));
        }

        {
            // has undefined
            // @ts-expect-error
            const _: string = chain.field("");
        }

        {
            const _: number | undefined = chain.field(3);
            assertNotAny(chain.field(3));
        }

        {
            // has undefined
            // @ts-expect-error
            const _: string = chain.field("");
        }

        {
            const _: number | undefined = chain.field(() => 3);
            assertNotAny(chain.field(() => 3));
        }

        {
            // has null
            // @ts-expect-error
            const _: number = chain.field(() => 3);
        }

        {
            const _: boolean = chain.field(Boolean);
            assertNotAny(chain.field(Boolean));
        }
    }
}
